"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRequiredUserId } from "@/lib/server-auth";
import { blockUser, createReport, SafetyError, unblockUser } from "@/lib/safety";

export async function createReportAction(formData: FormData) {
  const userId = await getRequiredUserId();
  const returnTo = safeReturnTo(formData.get("returnTo"));

  try {
    await createReport(userId, {
      targetType: String(formData.get("targetType") ?? ""),
      targetUserId: textValue(formData.get("targetUserId")),
      targetPostId: textValue(formData.get("targetPostId")),
      targetRequestId: textValue(formData.get("targetRequestId")),
      reason: String(formData.get("reason") ?? ""),
      details: textValue(formData.get("details"))
    });
  } catch (error) {
    redirectWithError(returnTo, reportErrorMessage(error));
  }

  revalidatePath(returnTo);
  redirect(`${returnTo}?success=${encodeURIComponent("通報を受け付けました。内容を確認します。")}`);
}

export async function blockUserAction(formData: FormData) {
  const userId = await getRequiredUserId();
  const returnTo = safeReturnTo(formData.get("returnTo"));

  try {
    await blockUser(userId, { blockedUserId: textValue(formData.get("blockedUserId")) });
  } catch (error) {
    redirectWithError(returnTo, blockErrorMessage(error));
  }

  revalidatePath("/partner-posts");
  revalidatePath(returnTo);
  redirect(`${returnTo}?success=${encodeURIComponent("このユーザーをブロックしました。")}`);
}

export async function unblockUserAction(formData: FormData) {
  const userId = await getRequiredUserId();
  const returnTo = safeReturnTo(formData.get("returnTo"));

  try {
    await unblockUser(userId, textValue(formData.get("blockedUserId")) ?? "");
  } catch (error) {
    redirectWithError(returnTo, blockErrorMessage(error));
  }

  revalidatePath("/partner-posts");
  revalidatePath("/profile");
  revalidatePath(returnTo);
  redirect(`${returnTo}?success=${encodeURIComponent("ブロックを解除しました。")}`);
}

function textValue(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function safeReturnTo(value: FormDataEntryValue | null) {
  if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return "/partner-posts";
}

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function reportErrorMessage(error: unknown) {
  if (error instanceof SafetyError) {
    return error.message;
  }

  return "通報を送信できませんでした。通信状況を確認して、もう一度お試しください。";
}

function blockErrorMessage(error: unknown) {
  if (error instanceof SafetyError) {
    return error.message;
  }

  return "ブロックできませんでした。通信状況を確認して、もう一度お試しください。";
}
