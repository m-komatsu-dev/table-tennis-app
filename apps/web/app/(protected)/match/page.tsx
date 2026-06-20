import Link from "next/link";
import { prisma } from "@table-tennis/db";
import { RecordCalendar } from "@/components/record-calendar";
import { RecordSummary } from "@/components/record-summary";
import { Badge, Card, EmptyState, PageHeader, PrimaryLink } from "@/components/ui";
import { formatDate, percentage } from "@/lib/format";
import { formatSetCount, matchResultLabels, matchTypeLabels } from "@/lib/match-record";
import { serializeMatchList } from "@/lib/serialize";
import { getRequiredUserId } from "@/lib/server-auth";
import { calculateWinRate } from "@/lib/stats";

export default async function MatchPage() {
  const userId = await getRequiredUserId();
  const [records, practiceDates] = await Promise.all([
    prisma.matchRecord.findMany({
      where: { userId },
      orderBy: { playedAt: "desc" }
    }),
    prisma.practiceLog.findMany({
      where: { userId },
      select: { practicedAt: true }
    })
  ]);
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
      <div className="mt-6">
        <RecordCalendar
          focus="match"
          matchDates={items.map((record) => record.playedAt)}
          practiceDates={practiceDates.map((log) => log.practicedAt.toISOString())}
        />
      </div>
      <h2 className="mb-3 mt-8 text-lg font-semibold text-slate-950">試合記録一覧</h2>
      {items.length === 0 ? (
        <EmptyState>試合記録はまだありません。</EmptyState>
      ) : (
        <div className="space-y-3">
          {items.map((record) => (
            <Link
              aria-label={`${record.opponentName}との試合記録の詳細を見る`}
              href={`/match/${record.id}`}
              key={record.id}
            >
              <Card>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="break-words font-semibold text-slate-950">
                        {formatDate(record.playedAt)} vs {record.opponentName}
                      </h2>
                      <Badge>{matchResultLabels[record.result]}</Badge>
                      <Badge>{matchTypeLabels[record.matchType]}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      相手所属: {record.opponentTeam || "未設定"}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">セット {formatSetCount(record.scores)}</span>
                      {record.scores.map((score) => (
                        <span className="rounded bg-slate-100 px-2 py-1 text-xs tabular-nums text-slate-700" key={score.set}>
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
                  <span className="text-sm font-semibold text-emerald-700 sm:shrink-0">詳細・編集</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
