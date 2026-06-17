"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorMessage, Field, inputClass } from "@/components/ui";
import type { ApiResponse, ProfileView } from "@/types/app";

const levels = [
  { value: "BEGINNER", label: "BEGINNER" },
  { value: "INTERMEDIATE", label: "INTERMEDIATE" },
  { value: "ADVANCED", label: "ADVANCED" },
  { value: "COMPETITIVE", label: "COMPETITIVE" }
];

export function ProfileForm({ profile }: { profile: ProfileView }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        club: String(formData.get("club") ?? ""),
        level: String(formData.get("level") ?? "BEGINNER"),
        playStyle: String(formData.get("playStyle") ?? ""),
        avatarUrl: String(formData.get("avatarUrl") ?? "")
      })
    });
    const payload = (await response.json()) as ApiResponse<ProfileView>;
    setIsSubmitting(false);

    if (!response.ok) {
      setError(payload.error ?? "プロフィールの保存に失敗しました");
      return;
    }

    setMessage("プロフィールを保存しました");
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <ErrorMessage message={error} />
      {message ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}
      <Field label="名前">
        <input className={inputClass} defaultValue={profile.name} name="name" required />
      </Field>
      <Field label="メールアドレス">
        <input className={inputClass} defaultValue={profile.email} disabled />
      </Field>
      <Field label="所属クラブ">
        <input className={inputClass} defaultValue={profile.club ?? ""} name="club" />
      </Field>
      <Field label="レベル">
        <select className={inputClass} defaultValue={profile.level} name="level">
          {levels.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="プレースタイル">
        <textarea
          className={inputClass}
          defaultValue={profile.playStyle ?? ""}
          name="playStyle"
          rows={4}
        />
      </Field>
      <Field label="アイコンURL">
        <input className={inputClass} defaultValue={profile.avatarUrl ?? ""} name="avatarUrl" type="url" />
      </Field>
      <button
        className="min-h-10 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "保存中..." : "保存"}
      </button>
    </form>
  );
}
