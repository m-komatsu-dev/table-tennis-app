import Link from "next/link";
import { prisma } from "@table-tennis/db";
import { AnalyticsCharts } from "@/components/analytics-charts";
import { Badge, Card, EmptyState, PageHeader, PrimaryLink } from "@/components/ui";
import {
  calculateDifficultOpponents,
  calculateEquipmentStats,
  calculateMonthlyPracticeStats,
  calculateOpponentStats,
  calculateRecentWinRateTrend,
  getChallengeMemos
} from "@/lib/analytics";
import { formatDate, percentage } from "@/lib/format";
import { matchResultLabels } from "@/lib/match-record";
import { getRequiredUserId } from "@/lib/server-auth";
import { calculateWinRate, getMonthlyStatsRange } from "@/lib/stats";

const ANALYTICS_MATCH_LIMIT = 2000;
const ANALYTICS_PRACTICE_LIMIT = 5000;
const MEMO_LIMIT = 50;
const memoKeywords = new Set(["課題", "反省", "ミス", "サーブ", "レシーブ", "バック", "フォア", "フットワーク"]);
const memoPattern = /(課題|反省|ミス|サーブ|レシーブ|バック|フォア|フットワーク)/g;

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (hours === 0) {
    return `${remainder}分`;
  }

  return remainder > 0 ? `${hours}時間${remainder}分` : `${hours}時間`;
}

function HighlightedMemo({ memo }: { memo: string }) {
  return (
    <>
      {memo.split(memoPattern).map((part, index) =>
        memoKeywords.has(part) ? (
          <mark className="rounded bg-amber-100 px-0.5 text-amber-950" key={`${part}-${index}`}>
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export default async function AnalyticsPage() {
  const userId = await getRequiredUserId();
  const now = new Date();
  const { firstMonth, afterLastMonth } = getMonthlyStatsRange(now);

  const [practiceDuration, totalMatches, wins, practiceLogs, matches] = await Promise.all([
    prisma.practiceLog.aggregate({
      where: { userId },
      _sum: { durationMin: true }
    }),
    prisma.matchRecord.count({ where: { userId } }),
    prisma.matchRecord.count({ where: { userId, result: "WIN" } }),
    prisma.practiceLog.findMany({
      where: { userId, practicedAt: { gte: firstMonth, lt: afterLastMonth } },
      select: { practicedAt: true, durationMin: true },
      orderBy: { practicedAt: "desc" },
      take: ANALYTICS_PRACTICE_LIMIT
    }),
    prisma.matchRecord.findMany({
      where: { userId },
      select: {
        id: true,
        playedAt: true,
        opponentName: true,
        opponentTeam: true,
        result: true,
        memo: true,
        equipmentId: true,
        equipment: { select: { id: true, blade: true } }
      },
      orderBy: { playedAt: "desc" },
      take: ANALYTICS_MATCH_LIMIT
    })
  ]);

  const equipmentStats = calculateEquipmentStats(matches);
  const opponentStats = calculateOpponentStats(matches);
  const difficultOpponents = calculateDifficultOpponents(opponentStats);
  const monthlyPractice = calculateMonthlyPracticeStats(practiceLogs, now);
  const recentTrend = calculateRecentWinRateTrend(matches);
  const challengeMemos = getChallengeMemos(matches, MEMO_LIMIT);
  const winRate = calculateWinRate(wins, totalMatches);
  const totalPracticeMinutes = practiceDuration._sum.durationMin ?? 0;
  const isLimited = totalMatches > matches.length;

  return (
    <>
      <PageHeader
        description="練習・試合データから傾向を確認し、次の改善につなげます。"
        title="分析"
      />

      {totalMatches < 2 || practiceLogs.length === 0 ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-6 text-emerald-900">
          <strong className="block">もっと記録すると分析できます。</strong>
          練習時間や試合結果、使用用具を記録すると、傾向が少しずつ見えてきます。
        </div>
      ) : null}

      <section aria-label="主要サマリー" className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "総練習時間", value: formatDuration(totalPracticeMinutes), accent: "text-emerald-700" },
          { label: "総試合数", value: `${totalMatches}試合`, accent: "text-blue-700" },
          { label: "勝率", value: percentage(winRate), accent: "text-emerald-700" },
          { label: "苦手な相手", value: `${difficultOpponents.length}人`, accent: "text-amber-700" }
        ].map((item) => (
          <Card className="p-5 sm:p-6" key={item.label}>
            <p className="text-sm font-semibold text-slate-500">{item.label}</p>
            <p className={`mt-2 text-3xl font-black tracking-tight tabular-nums ${item.accent}`}>{item.value}</p>
          </Card>
        ))}
      </section>

      {isLimited ? (
        <p className="mb-4 text-xs text-slate-500">集計負荷を抑えるため、相手・用具・メモ分析は直近{ANALYTICS_MATCH_LIMIT}試合を対象にしています。</p>
      ) : null}

      <AnalyticsCharts
        equipmentStats={equipmentStats}
        monthlyPractice={monthlyPractice}
        recentTrend={recentTrend}
      />

      <section className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/4 sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">対戦相手別勝率</h2>
            <p className="mt-1 text-sm text-slate-500">相手名と所属チームごとに集計・勝率の低い順</p>
          </div>
          <p className="text-xs font-semibold text-slate-500">{opponentStats.length}人</p>
        </div>
        {opponentStats.length > 0 ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs font-semibold text-slate-500">
                  <th className="border-b border-slate-200 px-3 py-3">対戦相手</th>
                  <th className="border-b border-slate-200 px-3 py-3">所属チーム</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-right">対戦数</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-right">勝利</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-right">敗北</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-right">勝率</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-right">最終対戦日</th>
                </tr>
              </thead>
              <tbody>
                {opponentStats.map((opponent) => (
                  <tr className="transition hover:bg-slate-50" key={opponent.key}>
                    <td className="border-b border-slate-100 px-3 py-3 font-bold text-slate-950">{opponent.opponentName}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-slate-600">{opponent.opponentTeam || "未設定"}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{opponent.totalMatches}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{opponent.wins}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{opponent.losses}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-right font-bold tabular-nums text-emerald-700">{percentage(opponent.winRate)}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-right text-slate-600">{formatDate(opponent.lastPlayedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState action={<PrimaryLink href="/match/new">試合を記録する</PrimaryLink>}>
              試合記録が増えると、対戦相手ごとの相性を分析できます。
            </EmptyState>
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/4 sm:p-6">
          <h2 className="text-lg font-bold text-slate-950">苦手な相手</h2>
          <p className="mt-1 text-sm text-slate-500">2試合以上対戦し、勝率50%未満の相手</p>
          {difficultOpponents.length > 0 ? (
            <div className="mt-5 space-y-3">
              {difficultOpponents.slice(0, 10).map((opponent) => (
                <article className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4" key={opponent.key}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-950">{opponent.opponentName}</h3>
                      <p className="text-xs text-slate-500">{opponent.opponentTeam || "所属未設定"}</p>
                    </div>
                    <span className="text-xl font-black tabular-nums text-amber-800">{percentage(opponent.winRate)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-600">
                    <span>{opponent.totalMatches}試合</span>
                    <span>{opponent.wins}勝</span>
                    <span>{opponent.losses}敗</span>
                    <span>直近 {formatDate(opponent.lastPlayedAt)}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {opponent.latestMemo || "直近のメモはありません。"}
                  </p>
                  <Link className="mt-3 inline-block text-xs font-bold text-emerald-700 hover:underline" href={`/match/${opponent.lastMatchId}`}>
                    直近の試合を見る →
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm leading-6 text-slate-600">
              <strong className="block text-slate-800">苦手な相手はまだ見つかっていません。</strong>
              試合記録が増えると分析できます。
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/4 sm:p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-950">課題メモ</h2>
              <p className="mt-1 text-sm text-slate-500">メモがある試合を新しい順に表示</p>
            </div>
            <Badge tone="slate">最大{MEMO_LIMIT}件</Badge>
          </div>
          {challengeMemos.length > 0 ? (
            <div className="mt-5 max-h-[52rem] space-y-3 overflow-y-auto pr-1">
              {challengeMemos.map((memo) => (
                <article className="rounded-xl border border-slate-200 p-4" key={memo.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <time className="text-xs font-semibold text-slate-500" dateTime={memo.playedAt}>{formatDate(memo.playedAt)}</time>
                    <span className="text-sm font-bold text-slate-950">vs {memo.opponentName}</span>
                    <Badge tone={memo.result === "WIN" ? "emerald" : memo.result === "LOSE" ? "red" : "slate"}>
                      {matchResultLabels[memo.result]}
                    </Badge>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700"><HighlightedMemo memo={memo.memo} /></p>
                  <Link className="mt-3 inline-block text-xs font-bold text-emerald-700 hover:underline" href={`/match/${memo.id}`}>
                    試合詳細を見る →
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm leading-6 text-slate-600">
              試合メモはまだありません。<br />次回に活かしたい気づきを残してみましょう。
            </div>
          )}
        </section>
      </div>
    </>
  );
}
