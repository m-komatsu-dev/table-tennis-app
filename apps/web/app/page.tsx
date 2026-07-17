import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-16 lg:px-8">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-700 ring-1 ring-emerald-100">
            Table Tennis Log
          </p>
          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-6xl">
            練習、試合、用具、成長をひとつの場所で。
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            卓球プレイヤー向けの記録プラットフォームです。Phase 1ではWeb版で日々の練習と試合を残し、プロフィールと用具、統計を管理できます。
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              新規登録
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              ログイン
            </Link>
          </div>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {["練習時間を月別で可視化", "試合結果とセットスコアを保存", "現在の用具とプロフィールを管理"].map(
            (item) => (
              <div key={item} className="rounded-2xl border border-slate-200/80 bg-white p-5 text-sm font-medium text-slate-700 shadow-sm shadow-slate-900/4">
                {item}
              </div>
            )
          )}
        </div>
        <footer className="mt-12 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-slate-500">
          <Link className="hover:text-emerald-700" href="/terms">
            利用規約
          </Link>
          <Link className="hover:text-emerald-700" href="/privacy">
            プライバシーポリシー
          </Link>
        </footer>
      </section>
    </main>
  );
}
