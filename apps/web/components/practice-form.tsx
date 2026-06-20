"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ErrorMessage, Field, buttonStyles, inputClass } from "@/components/ui";
import { toDateInputValue } from "@/lib/format";
import type { ApiResponse, PracticeLogView } from "@/types/app";

export function PracticeForm({ practice }: { practice?: PracticeLogView }) {
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
      const response = await fetch(practice ? `/api/practice/${practice.id}` : "/api/practice", {
        method: practice ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practicedAt: String(formData.get("practicedAt") ?? ""),
          durationMin: Number(formData.get("durationMin") ?? 0),
          location: String(formData.get("location") ?? ""),
          content: String(formData.get("content") ?? "")
        })
      });
      const payload = (await response.json()) as ApiResponse<PracticeLogView>;

      if (!response.ok || !payload.data) {
        setError(payload.error ?? "練習記録の保存に失敗しました");
        return;
      }

      router.push(practice ? `/practice/${payload.data.id}` : "/practice");
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
    <form className="space-y-6" onSubmit={handleSubmit}>
      <ErrorMessage message={error} />
      <div className="grid gap-5 sm:grid-cols-2">
      <Field hint="練習した日を選択してください。" label="練習日">
        <input
          className={inputClass}
          defaultValue={practice ? toDateInputValue(practice.practicedAt) : toDateInputValue(new Date())}
          name="practicedAt"
          required
          type="date"
        />
      </Field>
      <Field hint="1分〜1440分の範囲で入力できます。" label="練習時間（分）">
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
      </div>
      <Field label="場所">
        <input className={inputClass} defaultValue={practice?.location ?? ""} maxLength={120} name="location" placeholder="例：市民体育館" />
      </Field>
      <Field hint="練習メニュー、気づき、次回試したいことを残せます。" label="練習内容メモ">
        <textarea className={`${inputClass} min-h-44 resize-y`} defaultValue={practice?.content ?? ""} maxLength={4000} name="content" placeholder="例：フォアドライブと3球目攻撃を重点的に練習" rows={7} />
      </Field>
      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
        <Button
          className="sm:min-w-28"
          disabled={isSubmitting || isDeleting}
          type="submit"
        >
          {isSubmitting ? "保存中..." : "保存"}
        </Button>
        <Link className={buttonStyles({ variant: "secondary" })} href="/practice">
          一覧へ戻る
        </Link>
        {practice ? (
          <Button
            className="sm:ml-auto"
            disabled={isSubmitting || isDeleting}
            onClick={handleDelete}
            type="button"
            variant="danger"
          >
            {isDeleting ? "削除中..." : "削除"}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
