import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import {
  AccountDeletionError,
  accountDeletionRequestSchema,
  deleteUserAccount
} from "@/lib/account-deletion";
import { errorResponse, requireUserId } from "@/lib/api";

export async function DELETE(request: Request) {
  const session = await auth();
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return accountDeletionErrorResponse("入力内容を確認してください。", 400);
  }

  const parsed = accountDeletionRequestSchema.safeParse(body);

  if (!parsed.success) {
    return accountDeletionErrorResponse(validationMessage(parsed.error), 400);
  }

  try {
    await deleteUserAccount({
      userId,
      input: parsed.data,
      googleReauthenticatedAt: session?.user?.googleReauthenticatedAt ?? null
    });
  } catch (error) {
    if (error instanceof AccountDeletionError) {
      return accountDeletionFailureResponse(error);
    }

    return accountDeletionErrorResponse("アカウントを削除できませんでした。時間をおいて再度お試しください。", 500);
  }

  return NextResponse.json({ success: true });
}

function validationMessage(error: ZodError) {
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
      return accountDeletionErrorResponse("確認文言が一致しません。", 400);
    case "missing_irreversible_confirmation":
      return accountDeletionErrorResponse("アカウント削除への確認が必要です。", 400);
    case "incorrect_current_password":
      return accountDeletionErrorResponse("現在のパスワードが正しくありません。", 400);
    case "reauth_required":
      return accountDeletionErrorResponse("セキュリティのため、もう一度ログインしてください。", 403);
    case "not_found":
      return accountDeletionErrorResponse("すでにアカウントが存在しないか、ログイン状態が無効です。", 401);
    case "rate_limited":
      return accountDeletionErrorResponse("試行回数が多すぎます。時間をおいて再度お試しください。", 429);
    case "failed":
      return accountDeletionErrorResponse("アカウントを削除できませんでした。時間をおいて再度お試しください。", 500);
  }
}

function accountDeletionErrorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}
