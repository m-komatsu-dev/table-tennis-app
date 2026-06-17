"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, Suspense, useState } from "react";
import { ErrorMessage, Field, inputClass } from "@/components/ui";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirect: false
    });

    setIsSubmitting(false);

    if (result?.error) {
      setError("メールアドレスまたはパスワードが正しくありません");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">ログイン</h1>
        <p className="mt-1 text-sm text-slate-600">記録を続ける準備をしましょう。</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <ErrorMessage message={error} />
          <Field label="メールアドレス">
            <input className={inputClass} name="email" type="email" required />
          </Field>
          <Field label="パスワード">
            <input className={inputClass} name="password" type="password" required />
          </Field>
          <button
            className="min-h-11 w-full rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "ログイン中..." : "ログイン"}
          </button>
        </form>
        <button
          className="mt-3 min-h-11 w-full rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          type="button"
        >
          Googleでログイン
        </button>
        <p className="mt-5 text-center text-sm text-slate-600">
          アカウントがない場合は{" "}
          <Link className="font-semibold text-emerald-700" href="/register">
            新規登録
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
          <div className="text-sm text-slate-600">読み込み中...</div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
