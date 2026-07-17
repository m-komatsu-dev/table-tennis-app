"use client";

import { FormEvent, useState } from "react";
import { signOut } from "next-auth/react";
import { Button, ErrorMessage, Field, SuccessMessage, inputClass } from "@/components/ui";
import type { ApiResponse } from "@/types/app";

type PasswordChangeResponse = {
  message: string;
};

export function PasswordChangeLite({ canChangePassword }: { canChangePassword: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: String(formData.get("currentPassword") ?? ""),
          newPassword: String(formData.get("newPassword") ?? ""),
          confirmPassword: String(formData.get("confirmPassword") ?? "")
        })
      });
      const payload = (await response.json()) as ApiResponse<PasswordChangeResponse>;

      if (!response.ok || !payload.data) {
        setError(payload.error ?? "パスワードを変更できませんでした");
        return;
      }

      form.reset();
      setMessage(payload.data.message);
      await signOut({ redirectTo: "/login?passwordChanged=1" });
    } catch {
      setError("通信に失敗しました。時間をおいて再試行してください。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-bold tracking-tight text-slate-950">パスワード変更Lite</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        メール・パスワードで登録したアカウントのパスワードを変更できます。
      </p>

      {!canChangePassword ? (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
          Googleログインのみのアカウントでは、この画面からパスワード変更は利用できません。
        </div>
      ) : (
        <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
          <ErrorMessage message={error} />
          <SuccessMessage message={message} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="現在のパスワード">
              <input
                autoComplete="current-password"
                className={inputClass}
                name="currentPassword"
                required
                type="password"
              />
            </Field>
            <Field label="新しいパスワード">
              <input
                autoComplete="new-password"
                className={inputClass}
                maxLength={128}
                minLength={8}
                name="newPassword"
                required
                type="password"
              />
            </Field>
            <Field label="新しいパスワード確認">
              <input
                autoComplete="new-password"
                className={inputClass}
                maxLength={128}
                minLength={8}
                name="confirmPassword"
                required
                type="password"
              />
            </Field>
          </div>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "変更中..." : "パスワードを変更"}
          </Button>
        </form>
      )}
    </div>
  );
}
