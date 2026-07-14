"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { Button, ErrorMessage, Field, SuccessMessage, inputClass } from "@/components/ui";
import type { ApiResponse } from "@/types/app";

type ResetPasswordResponse = {
  message: string;
};

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState<string | null>(token ? null : "再設定リンクが無効です");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!token) {
      setError("再設定リンクが無効です");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        password: String(formData.get("password") ?? ""),
        confirmPassword: String(formData.get("confirmPassword") ?? "")
      })
    });
    const payload = (await response.json()) as ApiResponse<ResetPasswordResponse>;

    setIsSubmitting(false);

    if (!response.ok) {
      setError(payload.error ?? "パスワードを変更できませんでした");
      return;
    }

    event.currentTarget.reset();
    setMessage(payload.data?.message ?? "パスワードを変更しました。新しいパスワードでログインしてください。");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/[0.07] sm:p-8">
        <Link className="mb-7 inline-flex items-center gap-2.5" href="/">
          <span className="grid size-10 place-items-center rounded-xl bg-emerald-600 font-black text-white">T</span>
          <span className="font-bold text-slate-950">Table Tennis Log</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">新しいパスワード</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          新しいパスワードを設定してください。再設定リンクは30分間有効です。
        </p>
        <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
          <ErrorMessage message={error} />
          <SuccessMessage message={message} />
          {!message ? (
            <>
              <Field label="新しいパスワード" hint="8文字以上、128文字以内で入力してください。">
                <input autoComplete="new-password" className={inputClass} minLength={8} name="password" type="password" required />
              </Field>
              <Field label="新しいパスワード確認">
                <input autoComplete="new-password" className={inputClass} minLength={8} name="confirmPassword" type="password" required />
              </Field>
              <Button className="w-full" disabled={isSubmitting || !token} type="submit">
                {isSubmitting ? "更新中..." : "パスワードを更新する"}
              </Button>
            </>
          ) : null}
        </form>
        <p className="mt-5 text-center text-sm text-slate-600">
          <Link className="font-semibold text-emerald-700" href="/login">
            ログイン画面へ
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center px-4 py-10">
          <div className="text-sm text-slate-600">読み込み中...</div>
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
