"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorMessage, Field, SuccessMessage, inputClass } from "@/components/ui";
import type { ApiResponse, ProfileView } from "@/types/app";

const MAX_AVATAR_SIZE = 1024 * 1024;

const levels = [
  { value: "BEGINNER", label: "初心者（地区・市大会レベル）" },
  { value: "INTERMEDIATE", label: "初級者（地区・市大会ランカー〜都道府県大会レベル）" },
  { value: "ADVANCED", label: "中級者（県大会ランカー〜地方大会（関東、関西、四国、東北、等）レベル）" },
  {
    value: "COMPETITIVE",
    label: "上級者（地方大会（関東、関西、四国、東北、等）ランカー〜全国大会レベル）"
  },
  { value: "PRO", label: "プロ（全国大会ランカー〜）" }
] as const;

const genders = [
  { value: "MALE", label: "男性" },
  { value: "FEMALE", label: "女性" },
  { value: "OTHER", label: "その他" },
  { value: "NO_ANSWER", label: "回答しない" }
] as const;

export function ProfileForm({ profile }: { profile: ProfileView }) {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError(null);
    setMessage(null);

    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setError("画像は1MB以下にしてください");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => setError("画像の読み込みに失敗しました");
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(formData.get("name") ?? ""),
          club: String(formData.get("club") ?? ""),
          level: String(formData.get("level") ?? "BEGINNER"),
          gender: String(formData.get("gender") ?? "NO_ANSWER"),
          playStyle: String(formData.get("playStyle") ?? ""),
          avatarUrl
        })
      });
      const payload = (await response.json()) as ApiResponse<ProfileView>;

      if (!response.ok || !payload.data) {
        setError(payload.error ?? "プロフィールの保存に失敗しました");
        return;
      }

      setAvatarUrl(payload.data.avatarUrl ?? "");
      setMessage("プロフィールを保存しました");
      router.refresh();
    } catch {
      setError("通信に失敗しました。時間をおいて再試行してください。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <ErrorMessage message={error} />
      <SuccessMessage message={message} />

      <div>
        <span className="text-sm font-medium text-slate-700">アイコン画像</span>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-2xl font-bold text-slate-500">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="プロフィール画像のプレビュー" className="h-full w-full object-cover" src={avatarUrl} />
            ) : (
              profile.name.slice(0, 1)
            )}
          </div>
          <div className="min-w-0 space-y-2">
            <input
              accept="image/*"
              className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
              onChange={handleAvatarChange}
              type="file"
            />
            <p className="text-xs text-slate-500">画像形式のみ・1MB以下。選択後に保存してください。</p>
            {avatarUrl ? (
              <button
                className="text-xs font-semibold text-red-700 hover:underline"
                onClick={() => setAvatarUrl("")}
                type="button"
              >
                画像を削除
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="名前">
          <input className={inputClass} defaultValue={profile.name} maxLength={80} name="name" required />
        </Field>
        <Field label="メールアドレス">
          <input className={inputClass} defaultValue={profile.email} disabled />
        </Field>
        <Field label="所属クラブ">
          <input className={inputClass} defaultValue={profile.club ?? ""} maxLength={120} name="club" />
        </Field>
        <Field label="性別">
          <select className={inputClass} defaultValue={profile.gender ?? "NO_ANSWER"} name="gender">
            {genders.map((gender) => (
              <option key={gender.value} value={gender.value}>
                {gender.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

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
          maxLength={200}
          name="playStyle"
          rows={4}
        />
      </Field>
      <button
        className="min-h-10 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "保存中..." : "プロフィールを保存"}
      </button>
    </form>
  );
}
