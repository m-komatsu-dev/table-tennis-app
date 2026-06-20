"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ErrorMessage, Field, SuccessMessage, inputClass } from "@/components/ui";
import { profileLevelOptions } from "@/lib/profile";
import type { ApiResponse, ProfileView } from "@/types/app";

const MAX_AVATAR_SIZE = 1024 * 1024;

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
    <form className="space-y-7" onSubmit={handleSubmit}>
      <ErrorMessage message={error} />
      <SuccessMessage message={message} />

      <section className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-white p-5">
        <span className="text-sm font-bold text-slate-800">プロフィール画像</span>
        <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="grid size-28 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white bg-emerald-100 text-3xl font-black text-emerald-700 shadow-md shadow-emerald-900/10">
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
            <p className="text-xs leading-5 text-slate-500">PNG・JPEGなどの画像形式、1MB以下。選択後にプロフィールを保存してください。</p>
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
      </section>

      <div>
        <h2 className="text-base font-bold text-slate-950">基本情報</h2>
        <p className="mt-1 text-sm text-slate-500">他の記録画面で表示する選手情報です。</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="名前">
          <input className={inputClass} defaultValue={profile.name} maxLength={80} name="name" required />
        </Field>
        <Field label="メールアドレス">
          <input className={inputClass} defaultValue={profile.email} disabled />
        </Field>
        <Field hint="所属がない場合は空欄でも構いません。" label="所属クラブ">
          <input className={inputClass} defaultValue={profile.club ?? ""} maxLength={120} name="club" placeholder="例：〇〇卓球クラブ" />
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
      </div>

      <Field hint="現在の競技レベルに最も近いものを選択してください。" label="レベル">
        <select className={inputClass} defaultValue={profile.level} name="level">
          {profileLevelOptions.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </Field>
      <Field hint="戦型や得意なプレーを200文字以内で入力できます。" label="プレースタイル">
        <textarea
          className={inputClass}
          defaultValue={profile.playStyle ?? ""}
          maxLength={200}
          name="playStyle"
          placeholder="例：右シェーク攻撃型。フォアドライブを軸に展開します。"
          rows={4}
        />
      </Field>
      <div className="border-t border-slate-100 pt-5">
      <Button
        className="w-full sm:w-auto sm:min-w-44"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "保存中..." : "プロフィールを保存"}
      </Button>
      </div>
    </form>
  );
}
