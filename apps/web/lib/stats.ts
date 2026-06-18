export type MonthlyStats = {
  month: string;
  practiceMinutes: number;
  matches: number;
  wins: number;
  winRate: number;
};

export type PracticeStatsInput = {
  practicedAt: Date;
  durationMin: number;
};

export type MatchStatsInput = {
  playedAt: Date;
  result: "WIN" | "LOSE" | "DRAW";
};

export function calculateWinRate(wins: number, totalMatches: number) {
  return totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthlyStatsRange(now = new Date(), monthCount = 6) {
  const firstMonth = addMonths(startOfMonth(now), -(monthCount - 1));

  return {
    firstMonth,
    afterLastMonth: addMonths(startOfMonth(now), 1)
  };
}

export function buildMonthlyStats(
  practiceLogs: PracticeStatsInput[],
  matches: MatchStatsInput[],
  now = new Date(),
  monthCount = 6
): MonthlyStats[] {
  const { firstMonth } = getMonthlyStatsRange(now, monthCount);
  const months = Array.from({ length: monthCount }, (_, index) => addMonths(firstMonth, index));
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
    winRate: calculateWinRate(entry.wins, entry.matches)
  }));
}
