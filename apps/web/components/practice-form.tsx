"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorMessage, Field, inputClass } from "@/components/ui";
import { toDateInputValue } from "@/lib/format";
import type { ApiResponse, EquipmentView, PracticeLogView } from "@/types/app";

export function PracticeForm({
  equipment,
  practice
}: {
  equipment: EquipmentView[];
  practice?: PracticeLogView;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const equipmentId = String(formData.get("equipmentId") ?? "");
      const response = await fetch(practice ? `/api/practice/${practice.id}` : "/api/practice", {
        method: practice ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practicedAt: String(formData.get("practicedAt") ?? ""),
          durationMin: Number(formData.get("durationMin") ?? 0),
          location: String(formData.get("location") ?? ""),
          content: String(formData.get("content") ?? ""),
          equipmentId: equipmentId || null
        })
      });
      const payload = (await response.json()) as ApiResponse<PracticeLogView>;

      if (!response.ok || !payload.data) {
        setError(payload.error ?? "練習記録の保存に失敗しました");
        return;
      }

      router.push(`/practice/${payload.data.id}`);
      router.refresh();
    } catch {
      setError("通信に失敗しました。時間をおいて再試行してください。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!practice || !window.confirm("この練習記録を削除しますか？")) {
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/practice/${practice.id}`, { method: "DELETE" });
      const payload = (await response.json()) as ApiResponse<{ id: string }>;

      if (!response.ok) {
        setError(payload.error ?? "練習記録の削除に失敗しました");
        return;
      }

      router.push("/practice");
      router.refresh();
    } catch {
      setError("通信に失敗しました。時間をおいて再試行してください。");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <ErrorMessage message={error} />
      <Field label="練習日">
        <input
          className={inputClass}
          defaultValue={practice ? toDateInputValue(practice.practicedAt) : toDateInputValue(new Date())}
          name="practicedAt"
          required
          type="date"
        />
      </Field>
      <Field label="練習時間（分）">
        <input
          className={inputClass}
          defaultValue={practice?.durationMin ?? 90}
          min={1}
          max={1440}
          name="durationMin"
          required
          type="number"
        />
      </Field>
      <Field label="場所">
        <input className={inputClass} defaultValue={practice?.location ?? ""} maxLength={120} name="location" />
      </Field>
      <Field label="使用用具">
        <select className={inputClass} defaultValue={practice?.equipmentId ?? ""} name="equipmentId">
          <option value="">未選択</option>
          {equipment.map((item) => (
            <option key={item.id} value={item.id}>
              {item.blade}
            </option>
          ))}
        </select>
      </Field>
      <Field label="練習内容メモ">
        <textarea className={inputClass} defaultValue={practice?.content ?? ""} maxLength={4000} name="content" rows={7} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <button
          className="min-h-10 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          disabled={isSubmitting || isDeleting}
          type="submit"
        >
          {isSubmitting ? "保存中..." : "保存"}
        </button>
        {practice ? (
          <button
            className="min-h-10 rounded-md border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50"
            disabled={isSubmitting || isDeleting}
            onClick={handleDelete}
            type="button"
          >
            {isDeleting ? "削除中..." : "削除"}
          </button>
        ) : null}
      </div>
    </form>
  );
}
