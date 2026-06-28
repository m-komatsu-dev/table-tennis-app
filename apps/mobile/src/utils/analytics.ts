import type { MatchRecord, PracticeLog } from "@/types";

export type AnalyticsPeriod = "7d" | "30d" | "6m" | "all";

export const analyticsPeriodOptions: { label: string; value: AnalyticsPeriod }[] = [
  { label: "7日", value: "7d" },
  { label: "30日", value: "30d" },
  { label: "6か月", value: "6m" },
  { label: "全期間", value: "all" }
];

export type OpponentSummary = {
  name: string;
  count: number;
};

export type PracticeMinutesPoint = {
  key: string;
  label: string;
  minutes: number;
};

export type PracticeMenuSummary = {
  name: string;
  minutes: number;
};

export type MatchResultSummary = {
  result: MatchRecord["result"];
  label: string;
  count: number;
};

export type AnalyticsSummary = {
  totalPractices: number;
  totalPracticeMinutes: number;
  averagePracticeMinutesPerSession: number;
  averagePracticeMinutesPerDay: number;
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  recentMatches: MatchRecord[];
  recentPractices: PracticeLog[];
  frequentOpponents: OpponentSummary[];
};

export function filterRecordsByPeriod<T>(records: T[], period: AnalyticsPeriod, getDate: (record: T) => string, now = new Date()) {
  if (period === "all") {
    return records;
  }

  const start = getPeriodStart(period, now);
  const end = endOfLocalDay(now);

  return records.filter((record) => {
    const date = localDateFromValue(getDate(record));
    return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
  });
}

export function buildAnalyticsSummary(
  practiceLogs: PracticeLog[],
  matchRecords: MatchRecord[],
  period: AnalyticsPeriod = "all",
  now = new Date()
): AnalyticsSummary {
  const wins = matchRecords.filter((match) => match.result === "WIN").length;
  const losses = matchRecords.filter((match) => match.result === "LOSE").length;
  const draws = matchRecords.filter((match) => match.result === "DRAW").length;
  const decidedMatches = wins + losses;
  const totalPracticeMinutes = practiceLogs.reduce((total, practice) => total + practice.durationMin, 0);
  const winRate = decidedMatches > 0 ? (wins / decidedMatches) * 100 : 0;
  const periodDays = getPeriodDayCount(period, practiceLogs, matchRecords, now);

  return {
    totalPractices: practiceLogs.length,
    totalPracticeMinutes,
    averagePracticeMinutesPerSession: practiceLogs.length > 0 ? Math.round(totalPracticeMinutes / practiceLogs.length) : 0,
    averagePracticeMinutesPerDay: periodDays > 0 ? Math.round(totalPracticeMinutes / periodDays) : 0,
    totalMatches: matchRecords.length,
    wins,
    losses,
    draws,
    winRate,
    recentMatches: sortByDateDesc(matchRecords, (match) => match.playedAt).slice(0, 5),
    recentPractices: sortByDateDesc(practiceLogs, (practice) => practice.practicedAt).slice(0, 5),
    frequentOpponents: buildFrequentOpponents(matchRecords).slice(0, 3)
  };
}

export function getPracticeMinutesSeries(
  practiceLogs: PracticeLog[],
  period: AnalyticsPeriod,
  now = new Date()
): PracticeMinutesPoint[] {
  if (period === "6m") {
    return getMonthlyPracticeMinutes(practiceLogs, 6, now);
  }

  if (period === "all") {
    return getAllPeriodMonthlyPracticeMinutes(practiceLogs, now);
  }

  return getDailyPracticeMinutes(practiceLogs, period === "7d" ? 7 : 30, now);
}

export function getLast7DaysPracticeMinutes(practiceLogs: PracticeLog[], now = new Date()): PracticeMinutesPoint[] {
  return getDailyPracticeMinutes(practiceLogs, 7, now);
}

export function getLast6MonthsPracticeMinutes(practiceLogs: PracticeLog[], now = new Date()): PracticeMinutesPoint[] {
  return getMonthlyPracticeMinutes(practiceLogs, 6, now);
}

export function getMatchResultSummary(matchRecords: MatchRecord[]): MatchResultSummary[] {
  const counts = matchRecords.reduce(
    (acc, match) => {
      acc[match.result] += 1;
      return acc;
    },
    { WIN: 0, LOSE: 0, DRAW: 0 } satisfies Record<MatchRecord["result"], number>
  );

  return [
    { result: "WIN", label: "勝利", count: counts.WIN },
    { result: "LOSE", label: "敗北", count: counts.LOSE },
    { result: "DRAW", label: "引分", count: counts.DRAW }
  ];
}

export function getOpponentRanking(matchRecords: MatchRecord[], limit = 5): OpponentSummary[] {
  return buildFrequentOpponents(matchRecords).slice(0, limit);
}

export function getPracticeMenuBreakdown(practiceLogs: PracticeLog[], limit = 5): PracticeMenuSummary[] {
  const totals = new Map<string, number>();

  practiceLogs.forEach((practice) => {
    const name = practice.practiceMenu?.title?.trim() || "指定なし";
    totals.set(name, (totals.get(name) ?? 0) + practice.durationMin);
  });

  return Array.from(totals.entries())
    .map(([name, minutes]) => ({ name, minutes }))
    .sort((a, b) => b.minutes - a.minutes || a.name.localeCompare(b.name, "ja"))
    .slice(0, limit);
}

export function getAveragePracticeMinutes(practiceLogs: PracticeLog[], period: AnalyticsPeriod = "all", now = new Date()) {
  const totalMinutes = practiceLogs.reduce((total, practice) => total + practice.durationMin, 0);
  const dayCount = getPeriodDayCount(period, practiceLogs, [], now);

  return {
    perSession: practiceLogs.length > 0 ? Math.round(totalMinutes / practiceLogs.length) : 0,
    perDay: dayCount > 0 ? Math.round(totalMinutes / dayCount) : 0
  };
}

export function getTrendComments(
  allPracticeLogs: PracticeLog[],
  periodPracticeLogs: PracticeLog[],
  periodMatchRecords: MatchRecord[],
  menuBreakdown: PracticeMenuSummary[],
  summary: AnalyticsSummary,
  now = new Date()
) {
  const comments: string[] = [];
  const recent7Minutes = sumPracticeMinutes(filterRecordsByDateRange(allPracticeLogs, addDays(startOfLocalDay(now), -6), endOfLocalDay(now)));
  const previous7Minutes = sumPracticeMinutes(
    filterRecordsByDateRange(allPracticeLogs, addDays(startOfLocalDay(now), -13), addDays(endOfLocalDay(now), -7))
  );

  if (recent7Minutes > 0 || previous7Minutes > 0) {
    if (recent7Minutes > previous7Minutes) {
      comments.push("最近7日間の練習時間は前の7日間より増えています。");
    } else if (recent7Minutes < previous7Minutes) {
      comments.push("最近7日間の練習時間は前の7日間より減っています。");
    } else {
      comments.push("最近7日間の練習時間は前の7日間と同じくらいです。");
    }
  }

  if (summary.totalMatches >= 5) {
    comments.push("この期間は試合数が多く、実戦の振り返りに向いています。");
  }

  if (summary.totalMatches > 0) {
    if (summary.winRate >= 60) {
      comments.push("直近の試合では勝率が高めです。");
    } else if (summary.winRate > 0 && summary.winRate < 40) {
      comments.push("直近の試合では勝率が低めです。課題を1つに絞って練習すると振り返りやすくなります。");
    }
  }

  const topMenu = menuBreakdown[0];
  if (topMenu && summary.totalPracticeMinutes > 0 && topMenu.minutes / summary.totalPracticeMinutes >= 0.45) {
    comments.push(`${topMenu.name}に多く時間を使っています。`);
  }

  if (periodPracticeLogs.length + periodMatchRecords.length <= 1) {
    comments.push("記録が少なめです。練習や試合を追加すると傾向が見えやすくなります。");
  }

  return comments.slice(0, 3);
}

export function formatMinutes(totalMinutes: number) {
  return `${Math.max(0, Math.round(totalMinutes))}分`;
}

export function formatDuration(totalMinutes: number) {
  const safeMinutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;

  if (hours <= 0) {
    return `${safeMinutes}分`;
  }

  return `${hours}時間${String(minutes).padStart(2, "0")}分`;
}

export function formatPercentage(value: number) {
  if (value <= 0) {
    return "0%";
  }

  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
}

export function formatWinRate(value: number) {
  return formatPercentage(value);
}

export function formatDateLabel(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function formatMonthLabel(date: Date) {
  return `${date.getMonth() + 1}月`;
}

function getDailyPracticeMinutes(practiceLogs: PracticeLog[], dayLength: number, now = new Date()) {
  const days = Array.from({ length: dayLength }, (_, index) => addDays(startOfLocalDay(now), index - dayLength + 1));
  const totals = new Map(days.map((day) => [formatDateKey(day), 0]));

  practiceLogs.forEach((practice) => {
    const key = formatDateKeyFromValue(practice.practicedAt);

    if (totals.has(key)) {
      totals.set(key, (totals.get(key) ?? 0) + practice.durationMin);
    }
  });

  return days.map((day) => {
    const key = formatDateKey(day);

    return {
      key,
      label: formatDateLabel(day),
      minutes: totals.get(key) ?? 0
    };
  });
}

function getMonthlyPracticeMinutes(practiceLogs: PracticeLog[], monthLength: number, now = new Date()) {
  const months = Array.from({ length: monthLength }, (_, index) => addMonths(startOfLocalMonth(now), index - monthLength + 1));
  const totals = new Map(months.map((month) => [formatMonthKey(month), 0]));

  practiceLogs.forEach((practice) => {
    const date = localDateFromValue(practice.practicedAt);
    const key = formatMonthKey(date);

    if (totals.has(key)) {
      totals.set(key, (totals.get(key) ?? 0) + practice.durationMin);
    }
  });

  return months.map((month) => {
    const key = formatMonthKey(month);

    return {
      key,
      label: formatMonthLabel(month),
      minutes: totals.get(key) ?? 0
    };
  });
}

function getAllPeriodMonthlyPracticeMinutes(practiceLogs: PracticeLog[], now = new Date()) {
  if (practiceLogs.length === 0) {
    return getMonthlyPracticeMinutes(practiceLogs, 6, now);
  }

  const earliest = sortByDateDesc(practiceLogs, (practice) => practice.practicedAt).at(-1);
  const start = earliest ? startOfLocalMonth(localDateFromValue(earliest.practicedAt)) : startOfLocalMonth(now);
  const end = startOfLocalMonth(now);
  const months: Date[] = [];

  for (let cursor = start; cursor.getTime() <= end.getTime(); cursor = addMonths(cursor, 1)) {
    months.push(cursor);
  }

  const totals = new Map(months.map((month) => [formatMonthKey(month), 0]));

  practiceLogs.forEach((practice) => {
    const date = localDateFromValue(practice.practicedAt);
    const key = formatMonthKey(date);
    totals.set(key, (totals.get(key) ?? 0) + practice.durationMin);
  });

  return months.map((month) => {
    const key = formatMonthKey(month);

    return {
      key,
      label: `${month.getFullYear()}/${month.getMonth() + 1}`,
      minutes: totals.get(key) ?? 0
    };
  });
}

function getPeriodStart(period: AnalyticsPeriod, now = new Date()) {
  const today = startOfLocalDay(now);

  if (period === "7d") {
    return addDays(today, -6);
  }

  if (period === "30d") {
    return addDays(today, -29);
  }

  return addMonths(today, -6);
}

function getPeriodDayCount(period: AnalyticsPeriod, practiceLogs: PracticeLog[], matchRecords: MatchRecord[], now = new Date()) {
  if (period !== "all") {
    const start = getPeriodStart(period, now);
    return Math.max(1, differenceInDays(start, startOfLocalDay(now)) + 1);
  }

  const dates = [
    ...practiceLogs.map((practice) => localDateFromValue(practice.practicedAt)),
    ...matchRecords.map((match) => localDateFromValue(match.playedAt))
  ].filter((date) => date.getTime() > 0);

  if (dates.length === 0) {
    return 0;
  }

  const earliest = dates.reduce((min, date) => (date.getTime() < min.getTime() ? date : min), dates[0]);
  return Math.max(1, differenceInDays(startOfLocalDay(earliest), startOfLocalDay(now)) + 1);
}

function filterRecordsByDateRange(practiceLogs: PracticeLog[], start: Date, end: Date) {
  return practiceLogs.filter((practice) => {
    const date = localDateFromValue(practice.practicedAt);
    return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
  });
}

function sumPracticeMinutes(practiceLogs: PracticeLog[]) {
  return practiceLogs.reduce((total, practice) => total + practice.durationMin, 0);
}

function buildFrequentOpponents(matchRecords: MatchRecord[]) {
  const counts = new Map<string, number>();

  matchRecords.forEach((match) => {
    const name = match.opponentName.trim() || "未設定";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ja"));
}

function sortByDateDesc<T>(items: T[], getDate: (item: T) => string) {
  return [...items].sort((a, b) => dateTime(getDate(b)) - dateTime(getDate(a)));
}

function dateTime(value: string) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function localDateFromValue(value: string) {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function startOfLocalMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function differenceInDays(start: Date, end: Date) {
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.floor((startOfLocalDay(end).getTime() - startOfLocalDay(start).getTime()) / dayMs);
}

function formatDateKeyFromValue(value: string) {
  return formatDateKey(localDateFromValue(value));
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
