"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, Suspense, useState } from "react";
import { Button, ErrorMessage, Field, inputClass } from "@/components/ui";

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
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/[0.07] sm:p-8">
        <Link className="mb-7 inline-flex items-center gap-2.5" href="/">
          <span className="grid size-10 place-items-center rounded-xl bg-emerald-600 font-black text-white">T</span>
          <span className="font-bold text-slate-950">Table Tennis Log</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">ログイン</h1>
        <p className="mt-2 text-sm text-slate-600">おかえりなさい。記録を続けましょう。</p>
        <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
          <ErrorMessage message={error} />
          <Field label="メールアドレス">
            <input autoComplete="email" className={inputClass} name="email" placeholder="you@example.com" type="email" required />
          </Field>
          <Field label="パスワード">
            <input autoComplete="current-password" className={inputClass} name="password" type="password" required />
          </Field>
          <Button
            className="w-full"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "ログイン中..." : "ログイン"}
          </Button>
        </form>
        <Button
          className="mt-3 w-full"
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          type="button"
          variant="secondary"
        >
          Googleでログイン
        </Button>
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
        <main className="flex min-h-screen items-center justify-center px-4 py-10">
          <div className="text-sm text-slate-600">読み込み中...</div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
