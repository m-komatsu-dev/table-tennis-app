import { ZodError } from "zod";
import { dataResponse, errorResponse } from "@/lib/api";
import {
  PASSWORD_RESET_SUCCESS_MESSAGE,
  PasswordResetError,
  resetPassword
} from "@/lib/password-reset";
import { resetPasswordSchema } from "@/lib/validators";

function validationMessage(error: ZodError) {
  const issue = error.issues[0];

  if (issue?.path[0] === "confirmPassword") {
    return issue.message;
  }

  if (issue?.path[0] === "token") {
    return "再設定リンクが無効です";
  }

  if (issue?.path[0] === "password") {
    return "パスワードが条件を満たしていません";
  }

  return "入力内容を確認してください";
}

function resetErrorMessage(error: PasswordResetError) {
  switch (error.code) {
    case "invalid":
      return "再設定リンクが無効です";
    case "expired":
      return "再設定リンクの有効期限が切れています";
    case "used":
      return "この再設定リンクはすでに使用されています";
    case "failed":
      return "パスワードを変更できませんでした";
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("入力内容を確認してください", 400);
  }

  const parsed = resetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(validationMessage(parsed.error), 400);
  }

  try {
    await resetPassword(parsed.data.token, parsed.data.password);
  } catch (error) {
    if (error instanceof PasswordResetError) {
      return errorResponse(resetErrorMessage(error), 400);
    }

    return errorResponse("パスワードを変更できませんでした", 500);
  }

  return dataResponse({ message: PASSWORD_RESET_SUCCESS_MESSAGE });
}
