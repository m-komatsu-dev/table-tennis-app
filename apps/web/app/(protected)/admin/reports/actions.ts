"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { getAdminUserId } from "@/lib/admin";
import { updateAdminReportStatus } from "@/lib/admin-reports";
import { reportStatusSchema } from "@/lib/validators";

export async function updateReportStatusAction(formData: FormData) {
  const adminUserId = await getAdminUserId();

  if (!adminUserId) {
    notFound();
  }

  const id = String(formData.get("id") ?? "");
  const status = reportStatusSchema.safeParse(formData.get("status"));

  if (!id || !status.success) {
    redirect(`/admin/reports/${id}?error=${encodeURIComponent("通報ステータスを更新できませんでした。")}`);
  }

  const updated = await updateAdminReportStatus(id, status.data);

  if (!updated) {
    redirect(`/admin/reports/${id}?error=${encodeURIComponent("通報ステータスを更新できませんでした。")}`);
  }

  revalidatePath("/admin/reports");
  revalidatePath(`/admin/reports/${id}`);
  redirect(`/admin/reports/${id}?success=${encodeURIComponent("通報ステータスを更新しました。")}`);
}
