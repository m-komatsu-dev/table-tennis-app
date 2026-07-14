"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { ChatError, createChatMessage } from "@/lib/chat";
import { createReport, SafetyError } from "@/lib/safety";
import { getRequiredUserId } from "@/lib/server-auth";

export async function createChatMessageAction(formData: FormData) {
  const userId = await getRequiredUserId();
  const roomId = String(formData.get("roomId") ?? "");

  if (!roomId) {
    redirect("/chat?error=" + encodeURIComponent("チャットを読み込めませんでした。"));
  }

  try {
    await createChatMessage(roomId, userId, {
      body: String(formData.get("body") ?? "")
    });
  } catch (error) {
    redirect(`/chat/${roomId}?error=${encodeURIComponent(messageForChatError(error))}`);
  }

  revalidatePath("/chat");
  revalidatePath(`/chat/${roomId}`);
  revalidatePath("/dashboard");
  redirect(`/chat/${roomId}?success=${encodeURIComponent("メッセージを送信しました。")}`);
}

export async function reportChatMessageAction(formData: FormData) {
  const userId = await getRequiredUserId();
  const roomId = String(formData.get("roomId") ?? "");
  const messageId = String(formData.get("messageId") ?? "");

  if (!roomId || !messageId) {
    redirect("/chat?error=" + encodeURIComponent("チャットを読み込めませんでした。"));
  }

  try {
    await createReport(userId, {
      targetType: "CHAT_MESSAGE",
      targetMessageId: messageId,
      reason: String(formData.get("reason") ?? ""),
      details: String(formData.get("details") ?? "")
    });
  } catch (error) {
    const message = error instanceof SafetyError || error instanceof ZodError ? error.message : "通報を送信できませんでした。";
    redirect(`/chat/${roomId}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath(`/chat/${roomId}`);
  redirect(`/chat/${roomId}?success=${encodeURIComponent("通報を受け付けました。内容を確認します。")}`);
}

function messageForChatError(error: unknown) {
  if (error instanceof ChatError) {
    return error.message;
  }

  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "メッセージを送信できませんでした。";
  }

  return "メッセージを送信できませんでした。";
}
