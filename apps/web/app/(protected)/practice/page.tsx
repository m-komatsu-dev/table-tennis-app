import Link from "next/link";
import { prisma } from "@table-tennis/db";
import { Badge, Card, EmptyState, PageHeader, PrimaryLink } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { serializePracticeList } from "@/lib/serialize";
import { getRequiredUserId } from "@/lib/server-auth";

export default async function PracticePage() {
  const userId = await getRequiredUserId();
  const logs = await prisma.practiceLog.findMany({
    where: { userId },
    include: { equipment: true },
    orderBy: { practicedAt: "desc" }
  });
  const items = serializePracticeList(logs);

  return (
    <>
      <PageHeader
        action={<PrimaryLink href="/practice/new">新規作成</PrimaryLink>}
        description="練習内容、時間、場所、使用用具を記録します。"
        title="練習記録"
      />
      {items.length === 0 ? (
        <EmptyState>練習記録はまだありません。</EmptyState>
      ) : (
        <div className="space-y-3">
          {items.map((log) => (
            <Link href={`/practice/${log.id}`} key={log.id}>
              <Card>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-slate-950">{formatDate(log.practicedAt)}</h2>
                      <Badge>{log.durationMin}分</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{log.location || "場所未設定"}</p>
                    <p className="text-sm text-slate-600">用具: {log.equipment?.blade ?? "未選択"}</p>
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
