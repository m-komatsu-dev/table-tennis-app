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
import type { MonthlyStats } from "@/lib/stats";

export function DashboardCharts({ data }: { data: MonthlyStats[] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.04] sm:p-6">
        <h2 className="text-base font-bold text-slate-950">月別練習時間</h2>
        <p className="mt-1 text-xs text-slate-500">直近6か月の練習量</p>
        <div className="mt-4 h-72">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={data} margin={{ left: -20, right: 4 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
              <XAxis axisLine={false} dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
              <YAxis axisLine={false} tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
              <Tooltip contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 8px 24px rgba(15,23,42,.08)" }} />
              <Bar dataKey="practiceMinutes" fill="#10b981" name="練習時間（分）" radius={[7, 7, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.04] sm:p-6">
        <h2 className="text-base font-bold text-slate-950">月別勝率</h2>
        <p className="mt-1 text-xs text-slate-500">試合結果の推移</p>
        <div className="mt-4 h-72">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={data} margin={{ left: -20, right: 8 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
              <XAxis axisLine={false} dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
              <YAxis axisLine={false} domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
              <Tooltip contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 8px 24px rgba(15,23,42,.08)" }} />
              <Line activeDot={{ r: 6 }} dataKey="winRate" dot={{ fill: "#2563eb", r: 3 }} name="勝率（%）" stroke="#2563eb" strokeWidth={3} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
