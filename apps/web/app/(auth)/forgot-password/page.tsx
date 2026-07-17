"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button, ErrorMessage, Field, SuccessMessage, inputClass } from "@/components/ui";
import { passwordResetEmailEnabled } from "@/lib/password-reset-config";
import type { ApiResponse } from "@/types/app";

type ForgotPasswordResponse = {
  message: string;
};

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(formData.get("email") ?? "")
      })
    });
    const payload = (await response.json()) as ApiResponse<ForgotPasswordResponse>;

    setIsSubmitting(false);

    if (!response.ok) {
      setError(payload.error ?? "パスワード再設定メールを送信できませんでした");
      return;
    }

    setMessage(payload.data?.message ?? "入力されたメールアドレスが登録されている場合、パスワード再設定用のメールを送信しました。");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/[0.07] sm:p-8">
        <Link className="mb-7 inline-flex items-center gap-2.5" href="/">
          <span className="grid size-10 place-items-center rounded-xl bg-emerald-600 font-black text-white">T</span>
          <span className="font-bold text-slate-950">Table Tennis Log</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">パスワード再設定</h1>
        {passwordResetEmailEnabled ? (
          <>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              登録したメールアドレスを入力してください。
            </p>
            <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
              <ErrorMessage message={error} />
              <SuccessMessage message={message} />
              <Field label="メールアドレス">
                <input autoComplete="email" className={inputClass} name="email" placeholder="you@example.com" type="email" required />
              </Field>
              <Button className="w-full" disabled={isSubmitting} type="submit">
                {isSubmitting ? "送信中..." : "再設定メールを送信"}
              </Button>
            </form>
          </>
        ) : (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
            メールによるパスワード再設定は現在ご利用いただけません。ログイン済みの場合はプロフィール画面からパスワード変更Liteをご利用ください。
          </div>
        )}
        <p className="mt-5 text-center text-sm text-slate-600">
          <Link className="font-semibold text-emerald-700" href="/login">
            ログイン画面へ戻る
          </Link>
        </p>
      </div>
    </main>
  );
}
