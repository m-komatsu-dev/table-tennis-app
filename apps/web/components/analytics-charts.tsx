"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type {
  EquipmentStats,
  MonthlyPracticeStats,
  WinRateTrendPoint
} from "@/lib/analytics";
import { formatDate } from "@/lib/format";
import { matchResultLabels } from "@/lib/match-record";

const tooltipStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  boxShadow: "0 8px 24px rgba(15,23,42,.08)"
};

function ChartEmpty({ children }: { children: string }) {
  return (
    <div className="grid h-64 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 text-center text-sm leading-6 text-slate-600">
      {children}
    </div>
  );
}

export function AnalyticsCharts({
  monthlyPractice,
  recentTrend,
  equipmentStats
}: {
  monthlyPractice: MonthlyPracticeStats[];
  recentTrend: WinRateTrendPoint[];
  equipmentStats: EquipmentStats[];
}) {
  const hasPractice = monthlyPractice.some((entry) => entry.practiceCount > 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/4 sm:p-6">
          <h2 className="text-lg font-bold text-slate-950">月別練習時間</h2>
          <p className="mt-1 text-sm text-slate-500">直近6か月の練習量と練習回数</p>
          <div className="mt-5">
            {hasPractice ? (
              <>
                <div className="h-72">
                  <ResponsiveContainer height="100%" width="100%">
                    <BarChart data={monthlyPractice} margin={{ left: -18, right: 4, top: 8 }}>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                      <XAxis axisLine={false} dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
                      <YAxis axisLine={false} tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="totalMinutes" fill="#10b981" name="練習時間（分）" radius={[7, 7, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {monthlyPractice.map((entry) => (
                    <div className="rounded-xl bg-slate-50 px-2 py-2 text-center" key={entry.month}>
                      <p className="text-[10px] font-semibold text-slate-500">{entry.month}</p>
                      <p className="mt-0.5 text-xs font-bold text-slate-800">{entry.practiceCount}回</p>
                      <p className="text-[10px] text-slate-500">{entry.totalMinutes}分</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <ChartEmpty>練習記録が増えると、月ごとの練習量を比較できます。</ChartEmpty>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/4 sm:p-6">
          <h2 className="text-lg font-bold text-slate-950">直近10試合の勝率推移</h2>
          <p className="mt-1 text-sm text-slate-500">古い試合から見た累積勝率</p>
          <div className="mt-5">
            {recentTrend.length > 0 ? (
              <div>
                <div className="h-80">
                  <ResponsiveContainer height="100%" width="100%">
                    <LineChart data={recentTrend} margin={{ left: -18, right: 12, top: 8 }}>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                      <XAxis
                        axisLine={false}
                        dataKey="matchNumber"
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        tickFormatter={(value) => `${value}試合目`}
                        tickLine={false}
                      />
                      <YAxis axisLine={false} domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line
                        activeDot={{ r: 6 }}
                        dataKey="cumulativeWinRate"
                        dot={{ fill: "#2563eb", r: 4 }}
                        name="累積勝率（%）"
                        stroke="#2563eb"
                        strokeWidth={3}
                        type="monotone"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 max-h-56 space-y-1.5 overflow-y-auto pr-1">
                  {recentTrend.map((point) => (
                    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_3rem_4rem] items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs" key={`${point.playedAt}-${point.matchNumber}`}>
                      <span className="text-slate-500">{formatDate(point.playedAt)}</span>
                      <span className="truncate font-semibold text-slate-800">{point.opponentName}</span>
                      <span className={point.result === "WIN" ? "font-bold text-emerald-700" : point.result === "LOSE" ? "font-bold text-red-700" : "font-bold text-slate-600"}>
                        {matchResultLabels[point.result]}
                      </span>
                      <span className="text-right font-black tabular-nums text-blue-700">{Math.round(point.cumulativeWinRate * 10) / 10}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <ChartEmpty>試合記録が増えると、直近の勝率推移を確認できます。</ChartEmpty>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/4 sm:p-6">
        <h2 className="text-lg font-bold text-slate-950">用具別勝率</h2>
        <p className="mt-1 text-sm text-slate-500">試合で使用したラケットごとの成績</p>
        <div className="mt-5">
          {equipmentStats.length > 0 ? (
            <>
              <div style={{ height: Math.max(260, equipmentStats.length * 58) }}>
                <ResponsiveContainer height="100%" width="100%">
                  <BarChart data={equipmentStats} layout="vertical" margin={{ left: 12, right: 20 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" horizontal={false} />
                    <XAxis axisLine={false} domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} type="number" />
                    <YAxis
                      axisLine={false}
                      dataKey="equipmentName"
                      tick={{ fill: "#475569", fontSize: 12 }}
                      tickLine={false}
                      type="category"
                      width={150}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="winRate" fill="#0f766e" name="勝率（%）" radius={[0, 7, 7, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {equipmentStats.map((entry) => (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4" key={entry.equipmentId}>
                    <h3 className="wrap-break-words font-bold text-slate-950">{entry.equipmentName}</h3>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div><dt className="text-slate-500">試合数</dt><dd className="font-bold text-slate-900">{entry.totalMatches}試合</dd></div>
                      <div><dt className="text-slate-500">勝率</dt><dd className="font-bold text-emerald-700">{Math.round(entry.winRate * 10) / 10}%</dd></div>
                      <div><dt className="text-slate-500">勝利</dt><dd className="font-bold text-slate-900">{entry.wins}勝</dd></div>
                      <div><dt className="text-slate-500">敗北</dt><dd className="font-bold text-slate-900">{entry.losses}敗</dd></div>
                    </dl>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <ChartEmpty>試合記録で使用用具を選ぶと、用具ごとの勝率を比較できます。</ChartEmpty>
          )}
        </div>
      </section>
    </div>
  );
}
