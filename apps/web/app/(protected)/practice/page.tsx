import Link from "next/link";
import { prisma } from "@table-tennis/db";
import { RecordSummary } from "@/components/record-summary";
import { Badge, EmptyState, PageHeader, PrimaryLink } from "@/components/ui";
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
      <h2 className="mb-3 mt-8 text-lg font-semibold text-slate-950">練習記録一覧</h2>
      {items.length === 0 ? (
        <EmptyState>練習記録はまだありません。</EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((log) => (
            <Link
              aria-label={`${formatDate(log.practicedAt)}の練習記録の詳細を見る`}
              className="group flex aspect-[4/3] min-h-64 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
              href={`/practice/${log.id}`}
              key={log.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold text-slate-950">{formatDate(log.practicedAt)}</h2>
                <Badge>{log.durationMin}分</Badge>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-700">{log.location || "場所未設定"}</p>
              {log.content ? (
                <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-500">{log.content}</p>
              ) : (
                <p className="mt-3 text-sm text-slate-400">練習内容メモはありません</p>
              )}
              <span className="mt-auto border-t border-slate-100 pt-4 text-sm font-semibold text-emerald-700 group-hover:text-emerald-800">
                詳細・編集を見る →
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
