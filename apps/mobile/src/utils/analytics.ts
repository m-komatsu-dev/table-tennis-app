import type { MatchRecord, PracticeLog } from "@/types";

export type OpponentSummary = {
  name: string;
  count: number;
};

export type PracticeMinutesPoint = {
  key: string;
  label: string;
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
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  recentMatches: MatchRecord[];
  recentPractices: PracticeLog[];
  frequentOpponents: OpponentSummary[];
};

export function buildAnalyticsSummary(practiceLogs: PracticeLog[], matchRecords: MatchRecord[]): AnalyticsSummary {
  const wins = matchRecords.filter((match) => match.result === "WIN").length;
  const losses = matchRecords.filter((match) => match.result === "LOSE").length;
  const decidedMatches = wins + losses;
  const totalPracticeMinutes = practiceLogs.reduce((total, practice) => total + practice.durationMin, 0);
  const winRate = decidedMatches > 0 ? (wins / decidedMatches) * 100 : 0;

  return {
    totalPractices: practiceLogs.length,
    totalPracticeMinutes,
    totalMatches: matchRecords.length,
    wins,
    losses,
    winRate,
    recentMatches: sortByDateDesc(matchRecords, (match) => match.playedAt).slice(0, 5),
    recentPractices: sortByDateDesc(practiceLogs, (practice) => practice.practicedAt).slice(0, 5),
    frequentOpponents: buildFrequentOpponents(matchRecords).slice(0, 3)
  };
}

export function getLast7DaysPracticeMinutes(practiceLogs: PracticeLog[], now = new Date()): PracticeMinutesPoint[] {
  const days = Array.from({ length: 7 }, (_, index) => addDays(startOfLocalDay(now), index - 6));
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

export function getLast6MonthsPracticeMinutes(practiceLogs: PracticeLog[], now = new Date()): PracticeMinutesPoint[] {
  const months = Array.from({ length: 6 }, (_, index) => addMonths(startOfLocalMonth(now), index - 5));
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

export function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${totalMinutes}分`;
  }

  return `${hours}時間${String(minutes).padStart(2, "0")}分`;
}

export function formatWinRate(value: number) {
  if (value <= 0) {
    return "0%";
  }

  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
}

export function formatDateLabel(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function formatMonthLabel(date: Date) {
  return `${date.getMonth() + 1}月`;
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

function startOfLocalMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
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
