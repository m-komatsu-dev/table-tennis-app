"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
import { Button, ErrorMessage, Field, inputClass } from "@/components/ui";
import type { ApiResponse } from "@/types/app";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

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
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/[0.07] sm:p-8">
        <Link className="mb-7 inline-flex items-center gap-2.5" href="/">
          <span className="grid size-10 place-items-center rounded-xl bg-emerald-600 font-black text-white">T</span>
          <span className="font-bold text-slate-950">Table Tennis Log</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">新規登録</h1>
        <p className="mt-2 text-sm text-slate-600">無料でアカウントを作成し、記録を始めましょう。</p>
        <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
          <ErrorMessage message={error} />
          <Field label="名前">
            <input autoComplete="name" className={inputClass} name="name" placeholder="卓球 太郎" required />
          </Field>
          <Field label="メールアドレス">
            <input autoComplete="email" className={inputClass} name="email" placeholder="you@example.com" type="email" required />
          </Field>
          <Field label="パスワード">
            <input autoComplete="new-password" className={inputClass} minLength={8} name="password" type="password" required />
          </Field>
          <Button
            className="w-full"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "登録中..." : "登録して開始"}
          </Button>
        </form>
        <div className="my-5 flex items-center gap-3 text-xs font-semibold text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          <span>または</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <Button
          className="w-full"
          disabled={isGoogleSubmitting}
          onClick={() => {
            setError(null);
            setIsGoogleSubmitting(true);
            void signIn("google", { callbackUrl: "/dashboard" });
          }}
          type="button"
          variant="secondary"
        >
          {isGoogleSubmitting ? "Googleへ移動中..." : "Googleアカウントで始める"}
        </Button>
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
