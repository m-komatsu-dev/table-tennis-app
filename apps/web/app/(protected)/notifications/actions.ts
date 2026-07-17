"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { markAllNotificationsRead, markNotificationRead, NotificationError } from "@/lib/notifications";
import { getRequiredUserId } from "@/lib/server-auth";

export async function openNotificationAction(formData: FormData) {
  const userId = await getRequiredUserId();
  const notificationId = String(formData.get("notificationId") ?? "");

  if (!notificationId) {
    redirect("/notifications?error=" + encodeURIComponent("通知を読み込めませんでした。"));
  }

  let target = "/notifications?error=" + encodeURIComponent("この通知に対応する画面を開けませんでした。");

  try {
    const notification = await markNotificationRead(notificationId, userId);
    target = notification.actionPath ?? target;
  } catch (error) {
    const message = error instanceof NotificationError ? error.message : "通知を既読にできませんでした。";
    target = "/notifications?error=" + encodeURIComponent(message);
  }

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  redirect(target);
}

export async function markNotificationReadAction(formData: FormData) {
  const userId = await getRequiredUserId();
  const notificationId = String(formData.get("notificationId") ?? "");

  if (!notificationId) {
    redirect("/notifications?error=" + encodeURIComponent("通知を読み込めませんでした。"));
  }

  try {
    await markNotificationRead(notificationId, userId);
  } catch {
    redirect("/notifications?error=" + encodeURIComponent("通知を既読にできませんでした。"));
  }

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  redirect("/notifications?success=" + encodeURIComponent("通知を既読にしました。"));
}

export async function markAllNotificationsReadAction() {
  const userId = await getRequiredUserId();

  await markAllNotificationsRead(userId);

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  redirect("/notifications?success=" + encodeURIComponent("すべての通知を既読にしました。"));
}
