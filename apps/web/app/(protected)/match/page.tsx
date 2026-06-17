import Link from "next/link";
import { prisma } from "@table-tennis/db";
import { Badge, Card, EmptyState, PageHeader, PrimaryLink } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { serializeMatchList } from "@/lib/serialize";
import { getRequiredUserId } from "@/lib/server-auth";

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
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-slate-950">
                        {formatDate(record.playedAt)} vs {record.opponentName}
                      </h2>
                      <Badge>{record.result}</Badge>
                      <Badge>{record.matchType}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {record.scores.map((score) => `${score.me}-${score.opp}`).join(", ")}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-700">詳細</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
