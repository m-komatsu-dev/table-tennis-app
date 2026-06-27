import type { MatchRecord, PracticeLog } from "@/types";

export type OpponentSummary = {
  name: string;
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

function buildFrequentOpponents(matchRecords: MatchRecord[]) {
  const counts = new Map<string, number>();

  matchRecords.forEach((match) => {
    const name = match.opponentName.trim() || "相手未設定";
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
