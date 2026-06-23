import { describe, expect, test } from "vitest";
import { buildMonthlyStats, calculateWinRate, getMonthlyStatsRange } from "./stats";

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

describe("calculateWinRate", () => {
  test.each([
    { wins: 0, total: 0, expected: 0 },
    { wins: 1, total: 1, expected: 100 },
    { wins: 1, total: 2, expected: 50 }
  ])("$wins wins out of $total is $expected%", ({ wins, total, expected }) => {
    expect(calculateWinRate(wins, total)).toBe(expected);
  });

  test("2 wins out of 3 is approximately 66.7%", () => {
    expect(calculateWinRate(2, 3)).toBeCloseTo(66.7, 1);
  });
});

test("getMonthlyStatsRange creates a six month window ending after the current month", () => {
  const range = getMonthlyStatsRange(new Date("2026-06-18T00:00:00.000Z"));

  expect(localDateKey(range.firstMonth)).toBe("2026-01-01");
  expect(localDateKey(range.afterLastMonth)).toBe("2026-07-01");
});

test("buildMonthlyStats aggregates practice minutes and match win rate by month", () => {
  const result = buildMonthlyStats(
    [
      { practicedAt: new Date("2026-05-10T00:00:00.000Z"), durationMin: 90 },
      { practicedAt: new Date("2026-05-20T00:00:00.000Z"), durationMin: 60 },
      { practicedAt: new Date("2026-06-01T00:00:00.000Z"), durationMin: 120 }
    ],
    [
      { playedAt: new Date("2026-05-01T00:00:00.000Z"), result: "WIN" },
      { playedAt: new Date("2026-05-02T00:00:00.000Z"), result: "LOSE" },
      { playedAt: new Date("2026-06-01T00:00:00.000Z"), result: "DRAW" }
    ],
    new Date("2026-06-18T00:00:00.000Z")
  );

  const may = result.find((entry) => entry.month === "2026-05");
  const june = result.find((entry) => entry.month === "2026-06");

  expect(result).toHaveLength(6);
  expect(may).toMatchObject({ practiceMinutes: 150, practiceCount: 2, matches: 2, wins: 1, winRate: 50 });
  // DRAW is still a match in aggregate data and must not be counted as a win.
  expect(june).toMatchObject({ practiceMinutes: 120, matches: 1, wins: 0, winRate: 0 });
});
