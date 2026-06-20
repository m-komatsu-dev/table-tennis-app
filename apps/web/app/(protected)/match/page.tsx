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
import { formatDate, percentage } from "@/lib/format";
import { formatSetCount, matchResultLabels, matchTypeLabels } from "@/lib/match-record";
import {
  SEARCH_TEXT_MAX_LENGTH,
  buildMatchWhere,
  hasMatchSearchFilters,
  parseMatchSearchParams,
  type SearchParams
} from "@/lib/record-search";
import { serializeMatchList } from "@/lib/serialize";
import { getRequiredUserId } from "@/lib/server-auth";
import { calculateWinRate } from "@/lib/stats";

export default async function MatchPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const userId = await getRequiredUserId();
  const filters = parseMatchSearchParams(await searchParams);
  const hasFilters = hasMatchSearchFilters(filters);
  const records = await prisma.matchRecord.findMany({
    where: buildMatchWhere(userId, filters),
    include: { equipment: true },
    orderBy: { playedAt: "desc" }
  });
  const items = serializeMatchList(records);
  const wins = items.filter((record) => record.result === "WIN").length;
  const losses = items.filter((record) => record.result === "LOSE").length;
  const winRate = calculateWinRate(wins, items.length);

  return (
    <>
      <PageHeader
        action={<PrimaryLink href="/match/new">新規作成</PrimaryLink>}
        description="試合結果、セット別スコア、反省を記録します。"
        title="試合記録"
      />
      <Card className="mb-6">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-950">試合記録を検索</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">対戦相手、日付、勝敗、試合種別を組み合わせて絞り込めます。</p>
        </div>
        <form action="/match" method="get">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="対戦相手名">
              <input
                className={inputClass}
                defaultValue={filters.opponent ?? ""}
                maxLength={SEARCH_TEXT_MAX_LENGTH}
                name="opponent"
                placeholder="例：佐藤"
                type="search"
              />
            </Field>
            <Field label="相手所属チーム">
              <input
                className={inputClass}
                defaultValue={filters.team ?? ""}
                maxLength={SEARCH_TEXT_MAX_LENGTH}
                name="team"
                placeholder="例：熊本高校"
                type="search"
              />
            </Field>
            <Field label="開始日">
              <input className={inputClass} defaultValue={filters.from ?? ""} name="from" type="date" />
            </Field>
            <Field label="終了日">
              <input className={inputClass} defaultValue={filters.to ?? ""} name="to" type="date" />
            </Field>
            <Field label="勝敗">
              <select className={inputClass} defaultValue={filters.result ?? ""} name="result">
                <option value="">すべて</option>
                <option value="WIN">勝利</option>
                <option value="LOSE">敗北</option>
              </select>
            </Field>
            <Field label="試合種別">
              <select className={inputClass} defaultValue={filters.type ?? ""} name="type">
                <option value="">すべて</option>
                <option value="PRACTICE">練習試合</option>
                <option value="OFFICIAL">公式試合</option>
              </select>
            </Field>
          </div>
          <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row">
            <button className={buttonStyles({ className: "sm:min-w-28" })} type="submit">検索</button>
            <Link className={buttonStyles({ variant: "secondary", className: "sm:min-w-28" })} href="/match">
              条件クリア
            </Link>
          </div>
        </form>
      </Card>
      <RecordSummary
        items={[
          { label: "総試合数", value: `${items.length}試合` },
          { label: "勝利数", value: `${wins}勝` },
          { label: "敗北数", value: `${losses}敗` },
          { label: "勝率", value: percentage(winRate) }
        ]}
        title="試合サマリー"
        tone="blue"
      />
      <div className="mb-3 mt-8 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-950">試合記録一覧</h2>
        <p aria-live="polite" className="text-sm font-semibold text-slate-600">検索結果 {items.length}件</p>
      </div>
      {items.length === 0 ? (
        <EmptyState
          action={hasFilters
            ? <Link className={buttonStyles()} href="/match">検索条件をクリア</Link>
            : <PrimaryLink href="/match/new">試合を記録する</PrimaryLink>}
        >
          <p className="font-semibold text-slate-800">
            {hasFilters ? "条件に一致する試合記録がありません。" : "まだ試合記録がありません。"}
          </p>
          <p className="mt-1">
            {hasFilters ? "検索条件を変更してみてください。" : "最初の試合を記録して、結果とスコアを振り返りましょう。"}
          </p>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {items.map((record) => (
            <Link
              aria-label={`${record.opponentName}との試合記録の詳細を見る`}
              href={`/match/${record.id}`}
              key={record.id}
            >
              <Card className="group transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="wrap-break-words text-lg font-bold tracking-tight text-slate-950">
                        {formatDate(record.playedAt)} vs {record.opponentName}
                      </h2>
                      <Badge tone={record.result === "WIN" ? "emerald" : record.result === "LOSE" ? "red" : "slate"}>
                        {matchResultLabels[record.result]}
                      </Badge>
                      <Badge tone="blue">{matchTypeLabels[record.matchType]}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      相手所属: {record.opponentTeam || "未設定"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      使用用具: {record.equipment?.blade || "未設定"}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="mr-1 rounded-xl bg-slate-950 px-3 py-2 text-lg font-black tabular-nums text-white">
                        {formatSetCount(record.scores)}
                      </span>
                      {record.scores.map((score) => (
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold tabular-nums text-slate-700" key={score.set}>
                          {score.me} - {score.opp}
                        </span>
                      ))}
                    </div>
                    {record.memo ? (
                      <p className="mt-3 line-clamp-2 text-sm text-slate-500">{record.memo}</p>
                    ) : (
                      <p className="mt-3 text-sm text-slate-400">メモはありません</p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-emerald-700 transition group-hover:translate-x-0.5 sm:shrink-0">詳細・編集 →</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
