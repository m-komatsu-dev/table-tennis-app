import { z } from "zod";
import { prisma } from "@table-tennis/db";
import { mobileError, mobileJson, getMobileAuthContext, requireMobileAuth } from "@/lib/mobile-api";
import {
  GOOGLE_REAUTH_WINDOW_SECONDS,
  AccountDeletionError,
  accountDeletionRequestSchema,
  deleteUserAccount
} from "@/lib/account-deletion";

export async function GET(request: Request) {
  const userId = await requireMobileAuth(request);
  const authContext = userId ? await getMobileAuthContext(request) : null;

  if (!authContext || authContext.userId !== userId) {
    return mobileError("認証が必要です", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      passwordHash: true,
      googleId: true
    }
  });

  if (!user) {
    return mobileError("すでにアカウントが存在しないか、ログイン状態が無効です。", 401);
  }

  return mobileJson({
    authMethod: user.passwordHash ? "password" : user.googleId ? "google" : "unsupported",
    isGoogleReauthenticated: isRecent(authContext.iat)
  });
}

export async function DELETE(request: Request) {
  const userId = await requireMobileAuth(request);
  const authContext = userId ? await getMobileAuthContext(request) : null;

  if (!authContext || authContext.userId !== userId) {
    return mobileError("認証が必要です", 401);
  }

  let json: unknown;

  try {
    json = await request.json();
  } catch {
    return mobileError("入力内容を確認してください。", 400);
  }

  const parsed = accountDeletionRequestSchema.safeParse(json);

  if (!parsed.success) {
    return mobileError(validationMessage(parsed.error), 400);
  }

  try {
    await deleteUserAccount({
      userId: authContext.userId,
      input: parsed.data,
      mobileTokenIssuedAt: authContext.iat
    });
  } catch (error) {
    if (error instanceof AccountDeletionError) {
      return accountDeletionFailureResponse(error);
    }

    return mobileError("アカウントを削除できませんでした。時間をおいて再度お試しください。", 500);
  }

  return mobileJson({ success: true });
}

function validationMessage(error: z.ZodError) {
  const issue = error.issues[0];

  if (issue?.path[0] === "confirmationText") {
    return "確認文言が一致しません。";
  }

  if (issue?.path[0] === "confirmedIrreversible") {
    return "アカウント削除への確認が必要です。";
  }

  return "入力内容を確認してください。";
}

function accountDeletionFailureResponse(error: AccountDeletionError) {
  switch (error.code) {
    case "invalid_confirmation":
      return mobileError("確認文言が一致しません。", 400);
    case "missing_irreversible_confirmation":
      return mobileError("アカウント削除への確認が必要です。", 400);
    case "incorrect_current_password":
      return mobileError("現在のパスワードが正しくありません。", 400);
    case "reauth_required":
      return mobileError("セキュリティのため、もう一度ログインしてください。", 403);
    case "not_found":
      return mobileError("すでにアカウントが存在しないか、ログイン状態が無効です。", 401);
    case "rate_limited":
      return mobileError("試行回数が多すぎます。時間をおいて再度お試しください。", 429);
    case "failed":
      return mobileError("アカウントを削除できませんでした。時間をおいて再度お試しください。", 500);
  }
}

function isRecent(value: number) {
  const now = Math.floor(Date.now() / 1000);
  return value <= now && now - value <= GOOGLE_REAUTH_WINDOW_SECONDS;
}
