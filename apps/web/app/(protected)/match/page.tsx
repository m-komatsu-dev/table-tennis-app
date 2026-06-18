import Link from "next/link";
import { prisma } from "@table-tennis/db";
import { Badge, Card, EmptyState, PageHeader, PrimaryLink } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { serializeMatchList } from "@/lib/serialize";
import { getRequiredUserId } from "@/lib/server-auth";

const resultLabels = {
  WIN: "勝ち",
  LOSE: "負け",
  DRAW: "引分"
} as const;

const matchTypeLabels = {
  PRACTICE: "練習試合",
  OFFICIAL: "公式戦",
  TOURNAMENT: "大会"
} as const;

export default async function MatchPage() {
  const userId = await getRequiredUserId();
  const records = await prisma.matchRecord.findMany({
    where: { userId },
    orderBy: { playedAt: "desc" }
  });
  const items = serializeMatchList(records);

  return (
    <>
      <PageHeader
        action={<PrimaryLink href="/match/new">新規作成</PrimaryLink>}
        description="試合結果、セット別スコア、反省を記録します。"
        title="試合記録"
      />
      {items.length === 0 ? (
        <EmptyState>試合記録はまだありません。</EmptyState>
      ) : (
        <div className="space-y-3">
          {items.map((record) => (
            <Link href={`/match/${record.id}`} key={record.id}>
              <Card>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="break-words font-semibold text-slate-950">
                        {formatDate(record.playedAt)} vs {record.opponentName}
                      </h2>
                      <Badge>{resultLabels[record.result]}</Badge>
                      <Badge>{matchTypeLabels[record.matchType]}</Badge>
                    </div>
                    <p className="mt-2 break-words text-sm text-slate-600">
                      {record.scores.map((score) => `${score.me}-${score.opp}`).join(", ")}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-700 sm:shrink-0">詳細</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
