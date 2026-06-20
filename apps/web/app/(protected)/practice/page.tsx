import Link from "next/link";
import { prisma } from "@table-tennis/db";
import { RecordCalendar } from "@/components/record-calendar";
import { RecordSummary } from "@/components/record-summary";
import { Badge, Card, EmptyState, PageHeader, PrimaryLink } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { serializePracticeList } from "@/lib/serialize";
import { getRequiredUserId } from "@/lib/server-auth";

export default async function PracticePage() {
  const userId = await getRequiredUserId();
  const [logs, matchDates] = await Promise.all([
    prisma.practiceLog.findMany({
      where: { userId },
      include: { equipment: true },
      orderBy: { practicedAt: "desc" }
    }),
    prisma.matchRecord.findMany({
      where: { userId },
      select: { playedAt: true }
    })
  ]);
  const items = serializePracticeList(logs);
  const totalMinutes = items.reduce((total, log) => total + log.durationMin, 0);

  return (
    <>
      <PageHeader
        action={<PrimaryLink href="/practice/new">新規作成</PrimaryLink>}
        description="練習内容、時間、場所を記録します。"
        title="練習記録"
      />
      <RecordSummary
        items={[
          { label: "総練習回数", value: `${items.length}回` },
          { label: "総練習時間", value: `${totalMinutes}分` }
        ]}
        title="練習サマリー"
      />
      <div className="mt-6">
        <RecordCalendar
          focus="practice"
          matchDates={matchDates.map((record) => record.playedAt.toISOString())}
          practiceDates={items.map((log) => log.practicedAt)}
        />
      </div>
      <h2 className="mb-3 mt-8 text-lg font-semibold text-slate-950">練習記録一覧</h2>
      {items.length === 0 ? (
        <EmptyState>練習記録はまだありません。</EmptyState>
      ) : (
        <div className="space-y-3">
          {items.map((log) => (
            <Link
              aria-label={`${formatDate(log.practicedAt)}の練習記録の詳細を見る`}
              href={`/practice/${log.id}`}
              key={log.id}
            >
              <Card>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-slate-950">{formatDate(log.practicedAt)}</h2>
                      <Badge>{log.durationMin}分</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{log.location || "場所未設定"}</p>
                    {log.content ? (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-500">{log.content}</p>
                    ) : (
                      <p className="mt-2 text-sm text-slate-400">練習内容メモはありません</p>
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
