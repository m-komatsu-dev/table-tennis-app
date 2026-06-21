import Link from "next/link";
import { prisma } from "@table-tennis/db";
import { DashboardCharts } from "@/components/dashboard-charts";
import { RecordCalendar } from "@/components/record-calendar";
import { RecordSummary } from "@/components/record-summary";
import { Badge, Card, EmptyState, PageHeader, PrimaryLink } from "@/components/ui";
import { formatDate, percentage } from "@/lib/format";
import { matchResultLabels } from "@/lib/match-record";
import { serializeMatchList, serializePracticeList } from "@/lib/serialize";
import { getRequiredUserId } from "@/lib/server-auth";
import { buildMonthlyStats, calculateWinRate, getMonthlyStatsRange, type MonthlyStats } from "@/lib/stats";

async function getMonthlyStats(userId: string): Promise<MonthlyStats[]> {
  const now = new Date();
  const { firstMonth, afterLastMonth } = getMonthlyStatsRange(now);

  const [practiceLogs, matches] = await Promise.all([
    prisma.practiceLog.findMany({
      where: { userId, practicedAt: { gte: firstMonth, lt: afterLastMonth } },
      select: { practicedAt: true, durationMin: true }
    }),
    prisma.matchRecord.findMany({
      where: { userId, playedAt: { gte: firstMonth, lt: afterLastMonth } },
      select: { playedAt: true, result: true }
    })
  ]);

  return buildMonthlyStats(practiceLogs, matches, now);
}

export default async function DashboardPage() {
  const userId = await getRequiredUserId();

  const [
    practiceCount,
    practiceDuration,
    totalMatches,
    wins,
    losses,
    recentPractice,
    recentMatches,
    calendarPractice,
    calendarMatches,
    monthlyStats
  ] = await Promise.all([
    prisma.practiceLog.count({ where: { userId } }),
    prisma.practiceLog.aggregate({ where: { userId }, _sum: { durationMin: true } }),
    prisma.matchRecord.count({ where: { userId } }),
    prisma.matchRecord.count({ where: { userId, result: "WIN" } }),
    prisma.matchRecord.count({ where: { userId, result: "LOSE" } }),
    prisma.practiceLog.findMany({
      where: { userId },
      include: { equipment: true, practiceMenu: { select: { id: true, title: true } } },
      orderBy: { practicedAt: "desc" },
      take: 5
    }),
    prisma.matchRecord.findMany({
      where: { userId },
      include: { equipment: true },
      orderBy: { playedAt: "desc" },
      take: 5
    }),
    prisma.practiceLog.findMany({
      where: { userId },
      select: { id: true, practicedAt: true, durationMin: true }
    }),
    prisma.matchRecord.findMany({
      where: { userId },
      select: { id: true, playedAt: true, opponentName: true }
    }),
    getMonthlyStats(userId)
  ]);

  const totalPracticeMinutes = practiceDuration._sum.durationMin ?? 0;
  const winRate = calculateWinRate(wins, totalMatches);
  const practiceItems = serializePracticeList(recentPractice);
  const matchItems = serializeMatchList(recentMatches);

  return (
    <>
      <PageHeader
        title="ダッシュボード"
        description="練習量と試合結果を振り返り、次の一歩を記録しましょう。"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <RecordSummary
          items={[
            { label: "総練習回数", value: `${practiceCount}回` },
            { label: "総練習時間", value: `${totalPracticeMinutes}分` }
          ]}
          title="練習サマリー"
        />
        <RecordSummary
          items={[
            { label: "総試合数", value: `${totalMatches}試合` },
            { label: "勝利数", value: `${wins}勝` },
            { label: "敗北数", value: `${losses}敗` },
            { label: "勝率", value: percentage(winRate) }
          ]}
          title="試合サマリー"
          tone="blue"
        />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Link className="group flex min-h-28 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/4 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md" href="/practice/new">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-xl text-slate-700" aria-hidden="true">＋</span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-slate-950">練習を記録</span>
            <span className="mt-1 block text-xs text-slate-500">時間、場所、メモを残す</span>
          </span>
          <span className="ml-auto text-slate-400 transition group-hover:translate-x-1" aria-hidden="true">→</span>
        </Link>
        <Link className="group flex min-h-28 items-center gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm shadow-slate-900/4 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md" href="/match/new">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-xl text-blue-700" aria-hidden="true">◇</span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-slate-950">試合を記録</span>
            <span className="mt-1 block text-xs text-slate-500">勝敗とセット別スコアを登録</span>
          </span>
          <span className="ml-auto text-slate-400 transition group-hover:translate-x-1" aria-hidden="true">→</span>
        </Link>
        <Link className="group flex min-h-28 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/4 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md" href="/calendar">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-xl text-slate-700" aria-hidden="true">▦</span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-slate-950">カレンダーを見る</span>
            <span className="mt-1 block text-xs text-slate-500">練習と試合を月ごとに確認</span>
          </span>
          <span className="ml-auto text-slate-400 transition group-hover:translate-x-1" aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="mt-6">
        <RecordCalendar
          matchRecords={calendarMatches.map((record) => ({
            ...record,
            playedAt: record.playedAt.toISOString()
          }))}
          practiceRecords={calendarPractice.map((log) => ({
            ...log,
            practicedAt: log.practicedAt.toISOString()
          }))}
        />
      </div>
      <div className="mt-6">
        <DashboardCharts data={monthlyStats} />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">最近の練習記録</h2>
            <Link className="text-sm font-semibold text-emerald-700 hover:underline" href="/practice">すべて見る</Link>
          </div>
          {practiceItems.length === 0 ? (
            <EmptyState action={<PrimaryLink href="/practice/new">最初の練習を記録</PrimaryLink>}>
              まだ練習記録がありません。今日の練習から残してみましょう。
            </EmptyState>
          ) : (
            <div className="space-y-3">
              {practiceItems.map((log) => (
                <Link href={`/practice/${log.id}`} key={log.id}>
                  <Card className="transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-950">{formatDate(log.practicedAt)}</p>
                        <p className="text-sm text-slate-600">{log.location || "場所未設定"}</p>
                      </div>
                      <Badge tone="emerald">{log.durationMin}分</Badge>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">最近の試合記録</h2>
            <Link className="text-sm font-semibold text-emerald-700 hover:underline" href="/match">すべて見る</Link>
          </div>
          {matchItems.length === 0 ? (
            <EmptyState action={<PrimaryLink href="/match/new">最初の試合を記録</PrimaryLink>}>
              まだ試合記録がありません。セットスコアを記録してみましょう。
            </EmptyState>
          ) : (
            <div className="space-y-3">
              {matchItems.map((record) => (
                <Link href={`/match/${record.id}`} key={record.id}>
                  <Card className="transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-950">{record.opponentName}</p>
                        <p className="text-sm text-slate-600">{formatDate(record.playedAt)}</p>
                      </div>
                      <Badge tone={record.result === "WIN" ? "emerald" : record.result === "LOSE" ? "red" : "slate"}>
                        {matchResultLabels[record.result]}
                      </Badge>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
