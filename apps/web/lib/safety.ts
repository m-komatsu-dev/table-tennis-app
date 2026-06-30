import { Prisma, prisma } from "@table-tennis/db";
import type { ReportReason, ReportTargetType } from "@table-tennis/db";
import { nullableText } from "@/lib/api";
import { blockSchema, reportSchema } from "@/lib/validators";

export const reportReasonLabels: Record<ReportReason, string> = {
  SPAM: "スパム",
  HARASSMENT: "迷惑行為",
  INAPPROPRIATE: "不適切な内容",
  PERSONAL_INFORMATION: "個人情報が含まれている",
  FAKE_INFORMATION: "虚偽の情報",
  OTHER: "その他"
};

export const reportReasonOptions = Object.entries(reportReasonLabels).map(([value, label]) => ({
  value: value as ReportReason,
  label
}));

export type ReportInput = {
  targetType: ReportTargetType;
  targetUserId?: string | null;
  targetPostId?: string | null;
  targetRequestId?: string | null;
  reason: ReportReason;
  details?: string | null;
};

export async function createReport(reporterId: string, input: unknown) {
  const body = reportSchema.parse(input);
  const target = await resolveReportTarget(reporterId, body);

  return prisma.report.create({
    data: {
      reporterId,
      targetType: body.targetType,
      targetUserId: target.targetUserId,
      targetPostId: target.targetPostId,
      targetRequestId: target.targetRequestId,
      reason: body.reason,
      details: nullableText(body.details)
    },
    select: { id: true }
  });
}

export async function blockUser(blockerId: string, input: unknown) {
  const body = blockSchema.parse(input);

  if (body.blockedUserId === blockerId) {
    throw new SafetyError("自分自身はブロックできません", 400);
  }

  const target = await prisma.user.findUnique({
    where: { id: body.blockedUserId },
    select: { id: true }
  });

  if (!target) {
    throw new SafetyError("ユーザーが見つかりません", 404);
  }

  try {
    await prisma.userBlock.create({
      data: {
        blockerId,
        blockedId: body.blockedUserId
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: true as const, alreadyBlocked: true };
    }

    throw error;
  }

  return { ok: true as const, alreadyBlocked: false };
}

export async function unblockUser(blockerId: string, blockedUserId: string) {
  if (!blockedUserId) {
    throw new SafetyError("ユーザーが見つかりません", 404);
  }

  await prisma.userBlock.deleteMany({
    where: { blockerId, blockedId: blockedUserId }
  });

  return { ok: true as const };
}

export async function getBlockedUserIds(userId: string) {
  const blocks = await prisma.userBlock.findMany({
    where: {
      OR: [{ blockerId: userId }, { blockedId: userId }]
    },
    select: { blockerId: true, blockedId: true }
  });

  return [...new Set(blocks.map((block) => (block.blockerId === userId ? block.blockedId : block.blockerId)))];
}

export async function getBlockState(userId: string, otherUserId: string) {
  if (userId === otherUserId) {
    return { blockedByMe: false, blocksMe: false, isBlocked: false };
  }

  const blocks = await prisma.userBlock.findMany({
    where: {
      OR: [
        { blockerId: userId, blockedId: otherUserId },
        { blockerId: otherUserId, blockedId: userId }
      ]
    },
    select: { blockerId: true, blockedId: true }
  });
  const blockedByMe = blocks.some((block) => block.blockerId === userId);
  const blocksMe = blocks.some((block) => block.blockedId === userId);

  return { blockedByMe, blocksMe, isBlocked: blockedByMe || blocksMe };
}

export function blockedPartnerPostWhere(userId: string) {
  return {
    NOT: {
      owner: {
        OR: [
          { blocksReceived: { some: { blockerId: userId } } },
          { blocksCreated: { some: { blockedId: userId } } }
        ]
      }
    }
  } satisfies Prisma.PartnerPostWhereInput;
}

export class SafetyError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

async function resolveReportTarget(reporterId: string, body: ReportInput) {
  if (body.targetType === "USER") {
    const targetUserId = body.targetUserId;

    if (!targetUserId) {
      throw new SafetyError("通報するユーザーを指定してください", 400);
    }

    if (targetUserId === reporterId) {
      throw new SafetyError("自分自身は通報できません", 400);
    }

    const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });

    if (!target) {
      throw new SafetyError("ユーザーが見つかりません", 404);
    }

    return { targetUserId, targetPostId: null, targetRequestId: null };
  }

  if (body.targetType === "PARTNER_POST") {
    const targetPostId = body.targetPostId;

    if (!targetPostId) {
      throw new SafetyError("通報する募集を指定してください", 400);
    }

    const post = await prisma.partnerPost.findUnique({
      where: { id: targetPostId },
      select: { id: true, ownerId: true }
    });

    if (!post) {
      throw new SafetyError("募集が見つかりません", 404);
    }

    if (post.ownerId === reporterId) {
      throw new SafetyError("自分の募集は通報できません", 400);
    }

    return { targetUserId: post.ownerId, targetPostId: post.id, targetRequestId: null };
  }

  const targetRequestId = body.targetRequestId;

  if (!targetRequestId) {
    throw new SafetyError("通報する参加希望を指定してください", 400);
  }

  const request = await prisma.partnerRequest.findUnique({
    where: { id: targetRequestId },
    select: { id: true, requesterId: true }
  });

  if (!request) {
    throw new SafetyError("参加希望が見つかりません", 404);
  }

  if (request.requesterId === reporterId) {
    throw new SafetyError("自分自身は通報できません", 400);
  }

  return { targetUserId: request.requesterId, targetPostId: null, targetRequestId: request.id };
}
