import type { Metadata } from "next";
import Link from "next/link";
import { buttonStyles } from "@/components/ui";

export const metadata: Metadata = {
  title: "アカウント削除完了 | Table Tennis Log"
};

export default function AccountDeletedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm shadow-slate-900/5 sm:p-8">
        <div className="mx-auto grid size-12 place-items-center rounded-xl bg-emerald-600 font-black text-white">T</div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-950">アカウントを削除しました</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          これまでTable Tennis Logをご利用いただきありがとうございました。
        </p>
        <Link className={buttonStyles({ className: "mt-6" })} href="/login">
          ログイン画面へ
        </Link>
      </div>
    </main>
  );
}
