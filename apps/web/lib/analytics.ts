import {
  buildMonthlyStats,
  calculateWinRate,
  type PracticeStatsInput
} from "./stats";

export { calculateWinRate } from "./stats";

export type AnalyticsMatchInput = {
  id: string;
  playedAt: Date;
  opponentName: string;
  opponentTeam: string | null;
  result: "WIN" | "LOSE" | "DRAW";
  memo: string | null;
  equipmentId: string | null;
  equipment: {
    id: string;
    blade: string;
  } | null;
};

export type EquipmentStats = {
  equipmentId: string;
  equipmentName: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
};

export type OpponentStats = {
  key: string;
  opponentName: string;
  opponentTeam: string | null;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  lastPlayedAt: string;
  lastMatchId: string;
  latestMemo: string | null;
};

export type WinRateTrendPoint = {
  matchNumber: number;
  playedAt: string;
  opponentName: string;
  result: AnalyticsMatchInput["result"];
  cumulativeWinRate: number;
};

export type MonthlyPracticeStats = {
  month: string;
  practiceCount: number;
  totalMinutes: number;
};

export type ChallengeMemo = {
  id: string;
  playedAt: string;
  opponentName: string;
  result: AnalyticsMatchInput["result"];
  memo: string;
};

function opponentKey(name: string, team: string | null) {
  return JSON.stringify([name.trim().toLocaleLowerCase(), team?.trim().toLocaleLowerCase() ?? ""]);
}

export function calculateEquipmentStats(matches: AnalyticsMatchInput[]): EquipmentStats[] {
  const stats = new Map<string, EquipmentStats>();

  for (const match of matches) {
    if (!match.equipmentId || !match.equipment) {
      continue;
    }

    const current = stats.get(match.equipmentId) ?? {
      equipmentId: match.equipmentId,
      equipmentName: match.equipment.blade,
      totalMatches: 0,
      wins: 0,
      losses: 0,
      winRate: 0
    };

    current.totalMatches += 1;
    current.wins += match.result === "WIN" ? 1 : 0;
    current.losses += match.result === "LOSE" ? 1 : 0;
    stats.set(match.equipmentId, current);
  }

  return Array.from(stats.values())
    .map((entry) => ({
      ...entry,
      winRate: calculateWinRate(entry.wins, entry.totalMatches)
    }))
    .sort((a, b) => b.totalMatches - a.totalMatches || b.winRate - a.winRate);
}

export function calculateOpponentStats(matches: AnalyticsMatchInput[]): OpponentStats[] {
  const stats = new Map<string, OpponentStats>();

  for (const match of matches) {
    const key = opponentKey(match.opponentName, match.opponentTeam);
    const current = stats.get(key);
    const matchDate = match.playedAt.toISOString();

    if (!current) {
      stats.set(key, {
        key,
        opponentName: match.opponentName,
        opponentTeam: match.opponentTeam,
        totalMatches: 1,
        wins: match.result === "WIN" ? 1 : 0,
        losses: match.result === "LOSE" ? 1 : 0,
        winRate: 0,
        lastPlayedAt: matchDate,
        lastMatchId: match.id,
        latestMemo: match.memo?.trim() || null
      });
      continue;
    }

    current.totalMatches += 1;
    current.wins += match.result === "WIN" ? 1 : 0;
    current.losses += match.result === "LOSE" ? 1 : 0;

    if (match.playedAt.getTime() > new Date(current.lastPlayedAt).getTime()) {
      current.opponentName = match.opponentName;
      current.opponentTeam = match.opponentTeam;
      current.lastPlayedAt = matchDate;
      current.lastMatchId = match.id;
      current.latestMemo = match.memo?.trim() || null;
    }
  }

  return Array.from(stats.values())
    .map((entry) => ({
      ...entry,
      winRate: calculateWinRate(entry.wins, entry.totalMatches)
    }))
    .sort(
      (a, b) =>
        a.winRate - b.winRate ||
        b.totalMatches - a.totalMatches ||
        a.opponentName.localeCompare(b.opponentName, "ja")
    );
}

export function calculateRecentWinRateTrend(
  matches: AnalyticsMatchInput[],
  limit = 10
): WinRateTrendPoint[] {
  const recentMatches = [...matches]
    .sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime())
    .slice(0, limit)
    .reverse();
  let wins = 0;

  return recentMatches.map((match, index) => {
    wins += match.result === "WIN" ? 1 : 0;

    return {
      matchNumber: index + 1,
      playedAt: match.playedAt.toISOString(),
      opponentName: match.opponentName,
      result: match.result,
      cumulativeWinRate: calculateWinRate(wins, index + 1)
    };
  });
}

export function calculateDifficultOpponents(opponents: OpponentStats[]) {
  return opponents
    .filter((opponent) => opponent.totalMatches >= 2 && opponent.winRate < 50)
    .sort((a, b) => a.winRate - b.winRate || b.totalMatches - a.totalMatches);
}

export function calculateMonthlyPracticeStats(
  practiceLogs: PracticeStatsInput[],
  now = new Date(),
  monthCount = 6
): MonthlyPracticeStats[] {
  return buildMonthlyStats(practiceLogs, [], now, monthCount).map((entry) => ({
    month: entry.month,
    practiceCount: entry.practiceCount,
    totalMinutes: entry.practiceMinutes
  }));
}

export function getChallengeMemos(matches: AnalyticsMatchInput[], limit = 50): ChallengeMemo[] {
  return [...matches]
    .filter((match) => Boolean(match.memo?.trim()))
    .sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime())
    .slice(0, limit)
    .map((match) => ({
      id: match.id,
      playedAt: match.playedAt.toISOString(),
      opponentName: match.opponentName,
      result: match.result,
      memo: match.memo!.trim()
    }));
}
