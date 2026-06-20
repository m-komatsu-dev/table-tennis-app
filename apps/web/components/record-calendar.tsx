"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type PracticeCalendarRecord = {
  id: string;
  practicedAt: string;
  durationMin: number;
};

export type MatchCalendarRecord = {
  id: string;
  playedAt: string;
  opponentName: string;
};

function dateKey(value: string | Date) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function moveMonth(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function groupByDate<T>(records: T[], getDate: (record: T) => string) {
  const grouped = new Map<string, T[]>();

  for (const record of records) {
    const key = dateKey(getDate(record));
    grouped.set(key, [...(grouped.get(key) ?? []), record]);
  }

  return grouped;
}

export function RecordCalendar({
  practiceRecords = [],
  matchRecords = [],
  variant = "compact"
}: {
  practiceRecords?: PracticeCalendarRecord[];
  matchRecords?: MatchCalendarRecord[];
  variant?: "compact" | "detailed";
}) {
  const [displayMonth, setDisplayMonth] = useState(() => monthStart(new Date()));
  const practiceByDay = useMemo(
    () => groupByDate(practiceRecords, (record) => record.practicedAt),
    [practiceRecords]
  );
  const matchByDay = useMemo(
    () => groupByDate(matchRecords, (record) => record.playedAt),
    [matchRecords]
  );
  const calendarStart = new Date(
    displayMonth.getFullYear(),
    displayMonth.getMonth(),
    1 - displayMonth.getDay()
  );
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });
  const todayKey = dateKey(new Date());
  const isDetailed = variant === "detailed";

  return (
    <section className={`rounded-3xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.04] ${isDetailed ? "p-2 sm:p-6" : "p-3 sm:p-5"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-950">月間カレンダー</h2>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />練習
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-blue-500" />試合
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <button
            className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            onClick={() => setDisplayMonth(monthStart(new Date()))}
            type="button"
          >
            今日
          </button>
          <button
            aria-label="前月を表示"
            className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            onClick={() => setDisplayMonth((current) => moveMonth(current, -1))}
            type="button"
          >
            <span aria-hidden="true">‹</span><span className="hidden sm:inline">前月</span>
          </button>
          <p className="min-w-24 text-center text-sm font-semibold tabular-nums text-slate-900 sm:min-w-28">
            {displayMonth.getFullYear()}年{displayMonth.getMonth() + 1}月
          </p>
          <button
            aria-label="翌月を表示"
            className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            onClick={() => setDisplayMonth((current) => moveMonth(current, 1))}
            type="button"
          >
            <span className="hidden sm:inline">翌月</span><span aria-hidden="true">›</span>
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 text-center text-xs font-medium text-slate-500">
        {["日", "月", "火", "水", "木", "金", "土"].map((day, index) => (
          <div className={index === 0 ? "text-red-500" : index === 6 ? "text-blue-500" : ""} key={day}>
            {day}
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200">
        {days.map((date) => {
          const key = dateKey(date);
          const isCurrentMonth =
            date.getFullYear() === displayMonth.getFullYear() && date.getMonth() === displayMonth.getMonth();
          const practices = practiceByDay.get(key) ?? [];
          const matches = matchByDay.get(key) ?? [];

          return (
            <div
              className={`min-w-0 bg-white p-1.5 transition sm:p-2 ${
                isDetailed ? "min-h-24 sm:min-h-36 lg:min-h-40" : "min-h-16 sm:min-h-20"
              } ${isCurrentMonth ? "" : "bg-slate-50 text-slate-400"}`}
              key={key}
            >
              <div
                className={`grid size-6 place-items-center rounded-full text-xs tabular-nums sm:size-7 ${
                  key === todayKey ? "bg-emerald-600 font-bold text-white ring-4 ring-emerald-100" : "font-medium text-slate-700"
                }`}
              >
                {date.getDate()}
              </div>
              {isCurrentMonth && (practices.length > 0 || matches.length > 0) ? (
                <div className={`${isDetailed ? "max-h-24 overflow-y-auto" : ""} mt-2 flex min-w-0 flex-col gap-1 pr-0.5`}>
                  {practices.map((record) => (
                    <Link
                      aria-label={`${date.getMonth() + 1}月${date.getDate()}日の練習 ${record.durationMin}分を開く`}
                      className="flex min-h-7 min-w-0 items-center gap-1 rounded-lg bg-emerald-50 px-1.5 py-1 text-[10px] font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-100 transition hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-500 sm:text-xs"
                      href={`/practice/${record.id}`}
                      key={record.id}
                      title={`練習 ${record.durationMin}分`}
                    >
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <span className="min-w-0 truncate">{isDetailed ? `練習 ${record.durationMin}分` : "練習"}</span>
                    </Link>
                  ))}
                  {matches.map((record) => (
                    <Link
                      aria-label={`${date.getMonth() + 1}月${date.getDate()}日の${record.opponentName}との試合を開く`}
                      className="flex min-h-7 min-w-0 items-center gap-1 rounded-lg bg-blue-50 px-1.5 py-1 text-[10px] font-semibold text-blue-800 ring-1 ring-inset ring-blue-100 transition hover:bg-blue-100 focus-visible:ring-2 focus-visible:ring-blue-500 sm:text-xs"
                      href={`/match/${record.id}`}
                      key={record.id}
                      title={`試合 vs ${record.opponentName}`}
                    >
                      <span className="size-1.5 shrink-0 rounded-full bg-blue-500" />
                      <span className="min-w-0 truncate">{isDetailed ? `試合 vs ${record.opponentName}` : "試合"}</span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
