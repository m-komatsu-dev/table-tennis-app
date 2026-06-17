"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
import { ErrorMessage, Field, inputClass } from "@/components/ui";
import type { ApiResponse } from "@/types/app";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        email,
        password
      })
    });
    const payload = (await response.json()) as ApiResponse<unknown>;

    if (!response.ok) {
      setError(payload.error ?? "登録に失敗しました");
      setIsSubmitting(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false
    });

    setIsSubmitting(false);

    if (result?.error) {
      router.push("/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">新規登録</h1>
        <p className="mt-1 text-sm text-slate-600">メールアドレスとパスワードで始められます。</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <ErrorMessage message={error} />
          <Field label="名前">
            <input className={inputClass} name="name" required />
          </Field>
          <Field label="メールアドレス">
            <input className={inputClass} name="email" type="email" required />
          </Field>
          <Field label="パスワード">
            <input className={inputClass} minLength={8} name="password" type="password" required />
          </Field>
          <button
            className="min-h-11 w-full rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "登録中..." : "登録して開始"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-600">
          すでにアカウントがある場合は{" "}
          <Link className="font-semibold text-emerald-700" href="/login">
            ログイン
          </Link>
        </p>
      </div>
    </main>
  );
}
