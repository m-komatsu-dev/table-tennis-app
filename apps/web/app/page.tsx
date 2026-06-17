import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-12">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Table Tennis Log
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight text-slate-950 sm:text-6xl">
            練習、試合、用具、成長をひとつの場所で。
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            卓球プレイヤー向けの記録プラットフォームです。Phase 1ではWeb版で日々の練習と試合を残し、プロフィールと用具、統計を管理できます。
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              新規登録
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100"
            >
              ログイン
            </Link>
          </div>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {["練習時間を月別で可視化", "試合結果とセットスコアを保存", "現在の用具とプロフィールを管理"].map(
            (item) => (
              <div key={item} className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
                {item}
              </div>
            )
          )}
        </div>
      </section>
    </main>
  );
}
