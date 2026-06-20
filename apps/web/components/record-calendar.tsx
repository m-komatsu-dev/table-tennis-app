"use client";

import { useMemo, useState } from "react";

type CalendarFocus = "all" | "practice" | "match";

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

export function RecordCalendar({
  practiceDates = [],
  matchDates = [],
  focus = "all"
}: {
  practiceDates?: string[];
  matchDates?: string[];
  focus?: CalendarFocus;
}) {
  const [displayMonth, setDisplayMonth] = useState(() => monthStart(new Date()));
  const practiceDays = useMemo(() => new Set(practiceDates.map(dateKey)), [practiceDates]);
  const matchDays = useMemo(() => new Set(matchDates.map(dateKey)), [matchDates]);
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

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">月間カレンダー</h2>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />練習
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-blue-500" />試合
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            aria-label="前月を表示"
            className="grid size-9 place-items-center rounded-md border border-slate-200 text-lg text-slate-700 transition hover:bg-slate-50"
            onClick={() => setDisplayMonth((current) => moveMonth(current, -1))}
            type="button"
          >
            ‹
          </button>
          <p className="min-w-24 text-center text-sm font-semibold tabular-nums text-slate-900 sm:min-w-28">
            {displayMonth.getFullYear()}年{displayMonth.getMonth() + 1}月
          </p>
          <button
            aria-label="翌月を表示"
            className="grid size-9 place-items-center rounded-md border border-slate-200 text-lg text-slate-700 transition hover:bg-slate-50"
            onClick={() => setDisplayMonth((current) => moveMonth(current, 1))}
            type="button"
          >
            ›
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
      <div className="mt-1 grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200">
        {days.map((date) => {
          const key = dateKey(date);
          const isCurrentMonth = date.getMonth() === displayMonth.getMonth();
          const hasPractice = practiceDays.has(key);
          const hasMatch = matchDays.has(key);

          return (
            <div
              className={`min-h-16 bg-white p-1 sm:min-h-20 sm:p-1.5 ${isCurrentMonth ? "" : "bg-slate-50 text-slate-400"}`}
              key={key}
            >
              <div
                className={`grid size-6 place-items-center rounded-full text-xs tabular-nums sm:size-7 ${
                  key === todayKey ? "bg-slate-900 font-bold text-white" : ""
                }`}
              >
                {date.getDate()}
              </div>
              {isCurrentMonth && (hasPractice || hasMatch) ? (
                <div className="mt-1 flex flex-col gap-1">
                  {hasPractice ? (
                    <span
                      className={`flex items-center justify-center gap-1 rounded-sm bg-emerald-100 px-0.5 py-0.5 text-[9px] font-semibold text-emerald-800 sm:text-[10px] ${
                        focus === "practice" ? "ring-1 ring-emerald-500" : ""
                      }`}
                    >
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <span className="hidden sm:inline">練習</span>
                    </span>
                  ) : null}
                  {hasMatch ? (
                    <span
                      className={`flex items-center justify-center gap-1 rounded-sm bg-blue-100 px-0.5 py-0.5 text-[9px] font-semibold text-blue-800 sm:text-[10px] ${
                        focus === "match" ? "ring-1 ring-blue-500" : ""
                      }`}
                    >
                      <span className="size-1.5 shrink-0 rounded-full bg-blue-500" />
                      <span className="hidden sm:inline">試合</span>
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
