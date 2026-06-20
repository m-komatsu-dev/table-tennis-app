import Link from "next/link";
import { prisma } from "@table-tennis/db";
import { RecordSummary } from "@/components/record-summary";
import { Badge, Card, EmptyState, PageHeader, PrimaryLink } from "@/components/ui";
import { formatDate, percentage } from "@/lib/format";
import { formatSetCount, matchResultLabels, matchTypeLabels } from "@/lib/match-record";
import { serializeMatchList } from "@/lib/serialize";
import { getRequiredUserId } from "@/lib/server-auth";
import { calculateWinRate } from "@/lib/stats";

export default async function MatchPage() {
  const userId = await getRequiredUserId();
  const records = await prisma.matchRecord.findMany({
    where: { userId },
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
      <h2 className="mb-3 mt-8 text-lg font-semibold text-slate-950">試合記録一覧</h2>
      {items.length === 0 ? (
        <EmptyState action={<PrimaryLink href="/match/new">試合を記録する</PrimaryLink>}>
          <p className="font-semibold text-slate-800">まだ試合記録がありません。</p>
          <p className="mt-1">最初の試合を記録して、結果とスコアを振り返りましょう。</p>
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
                      <h2 className="break-words text-lg font-bold tracking-tight text-slate-950">
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
