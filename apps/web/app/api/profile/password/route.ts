import { ZodError } from "zod";
import { dataResponse, errorResponse, requireUserId } from "@/lib/api";
import {
  PASSWORD_CHANGE_SUCCESS_MESSAGE,
  PasswordChangeError,
  changePassword
} from "@/lib/password-change";
import { changePasswordSchema } from "@/lib/validators";

function validationMessage(error: ZodError) {
  const issue = error.issues[0];

  if (issue?.path[0] === "currentPassword") {
    return "現在のパスワードを入力してください";
  }

  if (issue?.path[0] === "confirmPassword") {
    return issue.message;
  }

  if (issue?.path[0] === "newPassword") {
    return "パスワードが条件を満たしていません";
  }

  return "入力内容を確認してください";
}

function changePasswordErrorResponse(error: PasswordChangeError) {
  switch (error.code) {
    case "unavailable":
      return errorResponse("メール・パスワードで登録したユーザーのみ利用できます", 403);
    case "incorrect_current":
      return errorResponse("現在のパスワードが正しくありません", 400);
    case "failed":
      return errorResponse("パスワードを変更できませんでした", 500);
  }
}

export async function POST(request: Request) {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("入力内容を確認してください", 400);
  }

  const parsed = changePasswordSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(validationMessage(parsed.error), 400);
  }

  try {
    await changePassword(
      userId,
      parsed.data.currentPassword,
      parsed.data.newPassword
    );
  } catch (error) {
    if (error instanceof PasswordChangeError) {
      return changePasswordErrorResponse(error);
    }

    return errorResponse("パスワードを変更できませんでした", 500);
  }

  return dataResponse({ message: PASSWORD_CHANGE_SUCCESS_MESSAGE });
}
