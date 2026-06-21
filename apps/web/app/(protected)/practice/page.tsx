import Link from "next/link";
import { prisma } from "@table-tennis/db";
import { RecordSummary } from "@/components/record-summary";
import {
  Badge,
  Card,
  EmptyState,
  Field,
  PageHeader,
  PrimaryLink,
  buttonStyles,
  inputClass
} from "@/components/ui";
import { formatDate } from "@/lib/format";
import {
  SEARCH_TEXT_MAX_LENGTH,
  buildPracticeWhere,
  hasPracticeSearchFilters,
  parsePracticeSearchParams,
  type SearchParams
} from "@/lib/record-search";
import { serializePracticeList } from "@/lib/serialize";
import { getRequiredUserId } from "@/lib/server-auth";

export default async function PracticePage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const userId = await getRequiredUserId();
  const filters = parsePracticeSearchParams(await searchParams);
  const hasFilters = hasPracticeSearchFilters(filters);
  const logs = await prisma.practiceLog.findMany({
    where: buildPracticeWhere(userId, filters),
    include: { equipment: true, practiceMenu: { select: { id: true, title: true } } },
    orderBy: { practicedAt: "desc" }
  });
  const items = serializePracticeList(logs);
  const totalMinutes = items.reduce((total, log) => total + log.durationMin, 0);

  return (
    <>
      <PageHeader
        action={<PrimaryLink href="/practice/new">新規作成</PrimaryLink>}
        description="練習内容、時間、場所を記録します。"
        title="練習記録"
      />
      <Card className="mb-6">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-950">練習記録を検索</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">キーワード、日付、場所を組み合わせて絞り込めます。</p>
        </div>
        <form action="/practice" method="get">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="キーワード">
              <input
                className={inputClass}
                defaultValue={filters.q ?? ""}
                maxLength={SEARCH_TEXT_MAX_LENGTH}
                name="q"
                placeholder="例：サーブ、バックドライブ"
                type="search"
              />
            </Field>
            <Field label="開始日">
              <input className={inputClass} defaultValue={filters.from ?? ""} name="from" type="date" />
            </Field>
            <Field label="終了日">
              <input className={inputClass} defaultValue={filters.to ?? ""} name="to" type="date" />
            </Field>
            <Field label="場所">
              <input
                className={inputClass}
                defaultValue={filters.location ?? ""}
                maxLength={SEARCH_TEXT_MAX_LENGTH}
                name="location"
                placeholder="例：高校、市民体育館"
                type="search"
              />
            </Field>
          </div>
          <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row">
            <button className={buttonStyles({ className: "sm:min-w-28" })} type="submit">検索</button>
            <Link className={buttonStyles({ variant: "secondary", className: "sm:min-w-28" })} href="/practice">
              条件クリア
            </Link>
          </div>
        </form>
      </Card>
      <RecordSummary
        items={[
          { label: "総練習回数", value: `${items.length}回` },
          { label: "総練習時間", value: `${totalMinutes}分` }
        ]}
        title="練習サマリー"
      />
      <div className="mb-3 mt-8 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-950">練習記録一覧</h2>
        <p aria-live="polite" className="text-sm font-semibold text-slate-600">検索結果 {items.length}件</p>
      </div>
      {items.length === 0 ? (
        <EmptyState
          action={hasFilters
            ? <Link className={buttonStyles()} href="/practice">検索条件をクリア</Link>
            : <PrimaryLink href="/practice/new">練習を記録する</PrimaryLink>}
        >
          <p className="font-semibold text-slate-800">
            {hasFilters ? "条件に一致する練習記録がありません。" : "まだ練習記録がありません。"}
          </p>
          <p className="mt-1">
            {hasFilters ? "検索条件を変更してみてください。" : "最初の練習を記録して、積み重ねを見える化しましょう。"}
          </p>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((log) => (
            <article
              className="group flex aspect-[4/3] min-h-64 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.04] transition duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-900/[0.06]"
              key={log.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold text-slate-950">{formatDate(log.practicedAt)}</h2>
                <Badge tone="emerald">{log.durationMin}分</Badge>
              </div>
              <p className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700">
                <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                {log.location || "場所未設定"}
              </p>
              {log.content ? (
                <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-500">{log.content}</p>
              ) : (
                <p className="mt-3 text-sm text-slate-400">練習内容メモはありません</p>
              )}
              {log.practiceMenu ? (
                <p className="mt-3 truncate text-sm text-slate-600">
                  使用メニュー：<Link className="font-semibold text-emerald-700 underline decoration-emerald-200 underline-offset-4 hover:text-emerald-900" href={`/practice-menus/${log.practiceMenu.id}`}>{log.practiceMenu.title}</Link>
                </p>
              ) : null}
              <Link aria-label={`${formatDate(log.practicedAt)}の練習記録の詳細を見る`} className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold text-emerald-700 group-hover:text-emerald-800" href={`/practice/${log.id}`}>
                詳細・編集を見る →
              </Link>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
