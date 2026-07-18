"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useEffect, useRef, useState } from "react";

function MobileGoogleSignInContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const flow = searchParams.get("flow");
  const state = searchParams.get("state");

  useEffect(() => {
    if (started.current) {
      return;
    }

    if (!flow || !state) {
      setError("Googleログインを完了できませんでした。アプリからもう一度お試しください。");
      return;
    }

    started.current = true;

    const callbackUrl = `/mobile-auth/google/complete?flow=${encodeURIComponent(flow)}&state=${encodeURIComponent(state)}`;
    void signIn("google", { callbackUrl }, { prompt: "select_account" });
  }, [flow, state]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 text-center shadow-xl shadow-slate-900/[0.07] sm:p-8">
        <div className="mx-auto grid size-12 place-items-center rounded-xl bg-emerald-600 font-black text-white">T</div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-950">Googleログイン</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {error ?? "Googleの認証画面へ移動しています。"}
        </p>
      </div>
    </main>
  );
}

export default function MobileGoogleSignInPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center px-4 py-10">
          <div className="text-sm text-slate-600">読み込み中...</div>
        </main>
      }
    >
      <MobileGoogleSignInContent />
    </Suspense>
  );
}
