import Link from "next/link";
import { prisma } from "@table-tennis/db";
import { DashboardCharts, type MonthlyStats } from "@/components/dashboard-charts";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { formatDate, percentage } from "@/lib/format";
import { serializeMatchList, serializePracticeList } from "@/lib/serialize";
import { getRequiredUserId } from "@/lib/server-auth";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

async function getMonthlyStats(userId: string): Promise<MonthlyStats[]> {
  const now = new Date();
  const firstMonth = addMonths(startOfMonth(now), -5);
  const afterLastMonth = addMonths(startOfMonth(now), 1);
  const months = Array.from({ length: 6 }, (_, index) => addMonths(firstMonth, index));
  const monthlyMap = new Map(
    months.map((date) => [
      monthKey(date),
      {
        month: monthKey(date),
        practiceMinutes: 0,
        matches: 0,
        wins: 0,
        winRate: 0
      }
    ])
  );

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

  for (const log of practiceLogs) {
    const entry = monthlyMap.get(monthKey(log.practicedAt));
    if (entry) {
      entry.practiceMinutes += log.durationMin;
    }
  }

  for (const match of matches) {
    const entry = monthlyMap.get(monthKey(match.playedAt));
    if (entry) {
      entry.matches += 1;
      if (match.result === "WIN") {
        entry.wins += 1;
      }
    }
  }

  return Array.from(monthlyMap.values()).map((entry) => ({
    ...entry,
    winRate: entry.matches > 0 ? (entry.wins / entry.matches) * 100 : 0
  }));
}

export default async function DashboardPage() {
  const userId = await getRequiredUserId();

  const [
    practiceCount,
    practiceDuration,
    totalMatches,
    wins,
    losses,
    draws,
    recentPractice,
    recentMatches,
    monthlyStats
  ] = await Promise.all([
    prisma.practiceLog.count({ where: { userId } }),
    prisma.practiceLog.aggregate({ where: { userId }, _sum: { durationMin: true } }),
    prisma.matchRecord.count({ where: { userId } }),
    prisma.matchRecord.count({ where: { userId, result: "WIN" } }),
    prisma.matchRecord.count({ where: { userId, result: "LOSE" } }),
    prisma.matchRecord.count({ where: { userId, result: "DRAW" } }),
    prisma.practiceLog.findMany({
      where: { userId },
      include: { equipment: true },
      orderBy: { practicedAt: "desc" },
      take: 5
    }),
    prisma.matchRecord.findMany({
      where: { userId },
      orderBy: { playedAt: "desc" },
      take: 5
    }),
    getMonthlyStats(userId)
  ]);

  const totalPracticeMinutes = practiceDuration._sum.durationMin ?? 0;
  const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
  const practiceItems = serializePracticeList(recentPractice);
  const matchItems = serializeMatchList(recentMatches);
  const cards = [
    { label: "総練習回数", value: `${practiceCount}回` },
    { label: "総練習時間", value: `${totalPracticeMinutes}分` },
    { label: "総試合数", value: `${totalMatches}試合` },
    { label: "勝利数", value: `${wins}勝` },
    { label: "敗北数", value: `${losses}敗` },
    { label: "引き分け数", value: `${draws}分` },
    { label: "勝率", value: percentage(winRate) }
  ];

  return (
    <>
      <PageHeader
        title="ダッシュボード"
        description="練習量と試合結果の現在地を確認できます。"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <p className="text-sm text-slate-600">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{card.value}</p>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Link className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-emerald-700 shadow-sm" href="/practice/new">
          練習を記録
        </Link>
        <Link className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-emerald-700 shadow-sm" href="/match/new">
          試合を記録
        </Link>
        <Link className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-emerald-700 shadow-sm" href="/equipment">
          用具を管理
        </Link>
      </div>
      <div className="mt-6">
        <DashboardCharts data={monthlyStats} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-950">最近の練習記録</h2>
          {practiceItems.length === 0 ? (
            <EmptyState>練習記録はまだありません。</EmptyState>
          ) : (
            <div className="space-y-3">
              {practiceItems.map((log) => (
                <Link href={`/practice/${log.id}`} key={log.id}>
                  <Card>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{formatDate(log.practicedAt)}</p>
                        <p className="text-sm text-slate-600">{log.location || "場所未設定"}</p>
                      </div>
                      <Badge>{log.durationMin}分</Badge>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-950">最近の試合記録</h2>
          {matchItems.length === 0 ? (
            <EmptyState>試合記録はまだありません。</EmptyState>
          ) : (
            <div className="space-y-3">
              {matchItems.map((record) => (
                <Link href={`/match/${record.id}`} key={record.id}>
                  <Card>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{record.opponentName}</p>
                        <p className="text-sm text-slate-600">{formatDate(record.playedAt)}</p>
                      </div>
                      <Badge>{record.result}</Badge>
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
