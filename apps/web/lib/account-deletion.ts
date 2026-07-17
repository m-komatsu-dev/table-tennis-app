import bcrypt from "bcryptjs";
import { prisma } from "@table-tennis/db";
import type { Prisma } from "@table-tennis/db";
import { z } from "zod";

export const ACCOUNT_DELETION_CONFIRMATION_TEXT = "アカウントを削除";
export const GOOGLE_REAUTH_WINDOW_SECONDS = 10 * 60;

const maxAttempts = 5;
const rateLimitWindowMs = 60 * 60 * 1000;

const attempts = new Map<string, number[]>();

export const accountDeletionRequestSchema = z.object({
  currentPassword: z.string().optional(),
  confirmationText: z.string(),
  confirmedIrreversible: z.boolean()
});

export type AccountDeletionRequest = z.infer<typeof accountDeletionRequestSchema>;

export type AccountDeletionFailureCode =
  | "invalid_confirmation"
  | "missing_irreversible_confirmation"
  | "incorrect_current_password"
  | "reauth_required"
  | "not_found"
  | "rate_limited"
  | "failed";

export class AccountDeletionError extends Error {
  constructor(readonly code: AccountDeletionFailureCode) {
    super(code);
  }
}

type DeleteUserAccountInput = {
  userId: string;
  input: AccountDeletionRequest;
  googleReauthenticatedAt?: number | null;
  mobileTokenIssuedAt?: number | null;
  comparePassword?: (password: string, passwordHash: string) => Promise<boolean>;
};

type ProfileImageDeletionTarget = {
  bucket: string;
  key: string;
};

type DeletionClient = Prisma.TransactionClient;

export async function deleteUserAccount({
  userId,
  input,
  googleReauthenticatedAt,
  mobileTokenIssuedAt,
  comparePassword = bcrypt.compare
}: DeleteUserAccountInput) {
  enforceDeletionConfirmation(input);
  enforceRateLimit(userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      passwordHash: true,
      googleId: true,
      avatarUrl: true
    }
  });

  if (!user) {
    throw new AccountDeletionError("not_found");
  }

  if (user.passwordHash) {
    if (!input.currentPassword) {
      throw new AccountDeletionError("incorrect_current_password");
    }

    const isValidPassword = await comparePassword(input.currentPassword, user.passwordHash);

    if (!isValidPassword) {
      throw new AccountDeletionError("incorrect_current_password");
    }
  } else if (user.googleId) {
    const reauthenticatedAt = googleReauthenticatedAt ?? mobileTokenIssuedAt ?? null;

    if (!isRecentlyReauthenticated(reauthenticatedAt)) {
      throw new AccountDeletionError("reauth_required");
    }
  } else {
    throw new AccountDeletionError("reauth_required");
  }

  const profileImageTarget = getProfileImageDeletionTarget(user.avatarUrl);

  try {
    await prisma.$transaction(async (tx) => {
      await deleteUserOwnedData(tx, user.id);
    });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      throw new AccountDeletionError("not_found");
    }

    throw new AccountDeletionError("failed");
  }

  await deleteProfileImageBestEffort(profileImageTarget);

  return { success: true };
}

export function resetAccountDeletionRateLimit() {
  attempts.clear();
}

function enforceDeletionConfirmation(input: AccountDeletionRequest) {
  if (input.confirmationText !== ACCOUNT_DELETION_CONFIRMATION_TEXT) {
    throw new AccountDeletionError("invalid_confirmation");
  }

  if (input.confirmedIrreversible !== true) {
    throw new AccountDeletionError("missing_irreversible_confirmation");
  }
}

function enforceRateLimit(userId: string) {
  const now = Date.now();
  const recentAttempts = (attempts.get(userId) ?? []).filter((timestamp) => now - timestamp < rateLimitWindowMs);

  if (recentAttempts.length >= maxAttempts) {
    attempts.set(userId, recentAttempts);
    throw new AccountDeletionError("rate_limited");
  }

  recentAttempts.push(now);
  attempts.set(userId, recentAttempts);
}

function isRecentlyReauthenticated(reauthenticatedAt: number | null | undefined) {
  if (!reauthenticatedAt || !Number.isFinite(reauthenticatedAt)) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  return reauthenticatedAt <= now && now - reauthenticatedAt <= GOOGLE_REAUTH_WINDOW_SECONDS;
}

async function deleteUserOwnedData(tx: DeletionClient, userId: string) {
  const ownedPosts = await tx.partnerPost.findMany({
    where: { ownerId: userId },
    select: { id: true }
  });
  const ownedPostIds = ownedPosts.map((post) => post.id);

  const partnerRequests = await tx.partnerRequest.findMany({
    where: {
      OR: [
        { requesterId: userId },
        ownedPostIds.length > 0 ? { postId: { in: ownedPostIds } } : undefined
      ].filter(Boolean) as Prisma.PartnerRequestWhereInput[]
    },
    select: { id: true }
  });
  const partnerRequestIds = partnerRequests.map((request) => request.id);

  const chatRooms = await tx.chatRoom.findMany({
    where: partnerRequestIds.length > 0 ? { partnerRequestId: { in: partnerRequestIds } } : { id: { in: [] } },
    select: { id: true }
  });
  const chatRoomIds = chatRooms.map((room) => room.id);

  const chatMessages = await tx.chatMessage.findMany({
    where: {
      OR: [
        { senderId: userId },
        chatRoomIds.length > 0 ? { roomId: { in: chatRoomIds } } : undefined
      ].filter(Boolean) as Prisma.ChatMessageWhereInput[]
    },
    select: { id: true }
  });
  const chatMessageIds = chatMessages.map((message) => message.id);

  await tx.notification.deleteMany({
    where: {
      OR: [
        { userId },
        chatRoomIds.length > 0 ? { chatRoomId: { in: chatRoomIds } } : undefined,
        chatMessageIds.length > 0 ? { chatMessageId: { in: chatMessageIds } } : undefined,
        ownedPostIds.length > 0 ? { partnerPostId: { in: ownedPostIds } } : undefined
      ].filter(Boolean) as Prisma.NotificationWhereInput[]
    }
  });

  await tx.report.deleteMany({
    where: {
      OR: [
        { reporterId: userId },
        { targetUserId: userId },
        ownedPostIds.length > 0 ? { targetPostId: { in: ownedPostIds } } : undefined,
        partnerRequestIds.length > 0 ? { targetRequestId: { in: partnerRequestIds } } : undefined,
        chatMessageIds.length > 0 ? { targetMessageId: { in: chatMessageIds } } : undefined
      ].filter(Boolean) as Prisma.ReportWhereInput[]
    }
  });

  await tx.feedback.deleteMany({ where: { userId } });
  await tx.userBlock.deleteMany({
    where: {
      OR: [{ blockerId: userId }, { blockedId: userId }]
    }
  });

  if (chatRoomIds.length > 0) {
    await tx.chatReadState.deleteMany({ where: { roomId: { in: chatRoomIds } } });
    await tx.chatMessage.deleteMany({ where: { roomId: { in: chatRoomIds } } });
    await tx.chatRoom.deleteMany({ where: { id: { in: chatRoomIds } } });
  }

  await tx.partnerRequest.deleteMany({
    where: {
      OR: [
        { requesterId: userId },
        ownedPostIds.length > 0 ? { postId: { in: ownedPostIds } } : undefined
      ].filter(Boolean) as Prisma.PartnerRequestWhereInput[]
    }
  });
  await tx.partnerPost.deleteMany({ where: { ownerId: userId } });

  await tx.passwordResetToken.deleteMany({ where: { userId } });
  await tx.practiceLog.deleteMany({ where: { userId } });
  await tx.matchRecord.deleteMany({ where: { userId } });
  await tx.practiceMenu.deleteMany({ where: { userId } });
  await tx.equipment.deleteMany({ where: { userId } });
  await tx.chatReadState.deleteMany({ where: { userId } });
  await tx.chatMessage.deleteMany({ where: { senderId: userId } });

  await tx.user.delete({
    where: { id: userId },
    select: { id: true }
  });
}

export function getProfileImageDeletionTarget(avatarUrl: string | null): ProfileImageDeletionTarget | null {
  if (!avatarUrl || avatarUrl.startsWith("data:")) {
    return null;
  }

  const configuredBucket = process.env.SUPABASE_PROFILE_IMAGE_BUCKET;

  if (!configuredBucket) {
    return null;
  }

  try {
    const url = new URL(avatarUrl);
    const marker = `/storage/v1/object/public/${configuredBucket}/`;
    const markerIndex = url.pathname.indexOf(marker);

    if (markerIndex < 0) {
      return null;
    }

    const key = decodeURIComponent(url.pathname.slice(markerIndex + marker.length));

    if (!isSafeProfileImageKey(key)) {
      return null;
    }

    return { bucket: configuredBucket, key };
  } catch {
    return null;
  }
}

async function deleteProfileImageBestEffort(target: ProfileImageDeletionTarget | null) {
  if (!target) {
    return;
  }

  console.warn("Profile image storage deletion is not configured; skipped safe profile image key cleanup.", {
    bucket: target.bucket
  });
}

function isSafeProfileImageKey(key: string) {
  return (
    key.length > 0 &&
    key.length <= 512 &&
    !key.startsWith("/") &&
    !key.includes("..") &&
    !key.includes("\\") &&
    !/[\u0000-\u001f\u007f]/.test(key)
  );
}

function isPrismaNotFoundError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "P2025";
}
