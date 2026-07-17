"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { getAdminUserId } from "@/lib/admin";
import { updateAdminFeedback } from "@/lib/admin-feedback";

export async function updateFeedbackAction(formData: FormData) {
  const adminUserId = await getAdminUserId();

  if (!adminUserId) {
    notFound();
  }

  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirect(`/admin/feedback?error=${encodeURIComponent("フィードバックを更新できませんでした。")}`);
  }

  try {
    const updated = await updateAdminFeedback(id, {
      status: formData.get("status"),
      adminNote: formData.get("adminNote")
    });

    if (!updated) {
      redirect(`/admin/feedback/${id}?error=${encodeURIComponent("フィードバックを更新できませんでした。")}`);
    }
  } catch {
    redirect(`/admin/feedback/${id}?error=${encodeURIComponent("フィードバックを更新できませんでした。")}`);
  }

  revalidatePath("/admin/feedback");
  revalidatePath(`/admin/feedback/${id}`);
  redirect(`/admin/feedback/${id}?success=${encodeURIComponent("フィードバックを更新しました。")}`);
}
