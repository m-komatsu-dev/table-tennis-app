import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@table-tennis/db";
import { sendPasswordResetEmail } from "@/lib/password-reset-email";

export const PASSWORD_RESET_REQUEST_MESSAGE =
  "入力されたメールアドレスが登録されている場合、パスワード再設定用のメールを送信しました。";
export const PASSWORD_RESET_SUCCESS_MESSAGE =
  "パスワードを変更しました。新しいパスワードでログインしてください。";

const resetTokenExpiresInMs = 30 * 60 * 1000;
const rateLimitWindowMs = 15 * 60 * 1000;
const maxRequestsPerWindow = 5;

type RateLimitStore = Map<string, number[]>;

const globalForPasswordReset = globalThis as unknown as {
  passwordResetRateLimitStore?: RateLimitStore;
};

const rateLimitStore =
  globalForPasswordReset.passwordResetRateLimitStore ?? new Map<string, number[]>();

if (process.env.NODE_ENV !== "production") {
  globalForPasswordReset.passwordResetRateLimitStore = rateLimitStore;
}

export type PasswordResetFailureCode = "invalid" | "expired" | "used" | "failed";

export class PasswordResetError extends Error {
  constructor(readonly code: PasswordResetFailureCode) {
    super(code);
  }
}

type RequestPasswordResetDeps = {
  now?: () => Date;
  randomToken?: () => string;
  sendEmail?: typeof sendPasswordResetEmail;
};

type ResetPasswordDeps = {
  now?: () => Date;
  hashPassword?: (password: string) => Promise<string>;
};

export function clearPasswordResetRateLimitForTest() {
  rateLimitStore.clear();
}

export function generatePasswordResetToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashPasswordResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function buildPasswordResetUrl(token: string, fallbackOrigin: string) {
  const configuredBaseUrl = [
    process.env.PASSWORD_RESET_BASE_URL,
    process.env.AUTH_URL,
    process.env.NEXTAUTH_URL,
    fallbackOrigin
  ].find((value): value is string => typeof value === "string" && value.trim().length > 0) ?? fallbackOrigin;
  const baseUrl = new URL(configuredBaseUrl);
  const resetUrl = new URL("/reset-password", baseUrl);
  resetUrl.searchParams.set("token", token);
  return resetUrl.toString();
}

function rememberRateLimitAttempt(key: string, nowMs: number) {
  const windowStartedAt = nowMs - rateLimitWindowMs;
  const attempts = (rateLimitStore.get(key) ?? []).filter((timestamp) => timestamp > windowStartedAt);
  const limited = attempts.length >= maxRequestsPerWindow;

  if (!limited) {
    attempts.push(nowMs);
  }

  rateLimitStore.set(key, attempts);
  return limited;
}

export function isPasswordResetRateLimited(email: string, requestKey: string, nowMs = Date.now()) {
  const normalizedEmail = email.toLowerCase();
  const keys = [`email:${normalizedEmail}`, `request:${requestKey}`];
  const limited = keys.some((key) => rememberRateLimitAttempt(key, nowMs));

  return limited;
}

export async function requestPasswordReset(
  email: string,
  fallbackOrigin: string,
  requestKey: string,
  deps: RequestPasswordResetDeps = {}
) {
  const normalizedEmail = email.toLowerCase();
  const now = deps.now?.() ?? new Date();

  if (isPasswordResetRateLimited(normalizedEmail, requestKey, now.getTime())) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, passwordHash: true }
  });

  if (!user?.passwordHash) {
    return;
  }

  const token = deps.randomToken?.() ?? generatePasswordResetToken();
  const tokenHash = hashPasswordResetToken(token);
  const expiresAt = new Date(now.getTime() + resetTokenExpiresInMs);

  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null
      },
      data: { usedAt: now }
    }),
    prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt
      }
    })
  ]);

  const resetUrl = buildPasswordResetUrl(token, fallbackOrigin);
  const sendEmail = deps.sendEmail ?? sendPasswordResetEmail;
  await sendEmail({ to: user.email, resetUrl });
}

export async function resetPassword(
  token: string,
  password: string,
  deps: ResetPasswordDeps = {}
) {
  const now = deps.now?.() ?? new Date();
  const tokenHash = hashPasswordResetToken(token);
  const tokenRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      usedAt: true
    }
  });

  if (!tokenRecord) {
    throw new PasswordResetError("invalid");
  }

  if (tokenRecord.usedAt) {
    throw new PasswordResetError("used");
  }

  if (tokenRecord.expiresAt <= now) {
    throw new PasswordResetError("expired");
  }

  const hashPassword = deps.hashPassword ?? ((value: string) => bcrypt.hash(value, 12));
  const passwordHash = await hashPassword(password);

  try {
    await prisma.$transaction(async (tx) => {
      const consumed = await tx.passwordResetToken.updateMany({
        where: {
          id: tokenRecord.id,
          usedAt: null,
          expiresAt: { gt: now }
        },
        data: { usedAt: now }
      });

      if (consumed.count !== 1) {
        throw new PasswordResetError("invalid");
      }

      await tx.user.update({
        where: { id: tokenRecord.userId },
        data: { passwordHash }
      });

      await tx.passwordResetToken.updateMany({
        where: {
          userId: tokenRecord.userId,
          usedAt: null
        },
        data: { usedAt: now }
      });
    });
  } catch (error) {
    if (error instanceof PasswordResetError) {
      throw error;
    }

    throw new PasswordResetError("failed");
  }
}
