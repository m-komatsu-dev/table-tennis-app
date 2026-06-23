import { describe, expect, test } from "vitest";
import {
  calculateDifficultOpponents,
  calculateEquipmentStats,
  calculateMonthlyPracticeStats,
  calculateOpponentStats,
  calculateRecentWinRateTrend,
  calculateWinRate,
  type AnalyticsMatchInput
} from "./analytics";

function match(
  overrides: Partial<AnalyticsMatchInput> & Pick<AnalyticsMatchInput, "id" | "playedAt" | "result">
): AnalyticsMatchInput {
  return {
    opponentName: "佐藤",
    opponentTeam: "市民クラブ",
    memo: null,
    equipmentId: "equipment-1",
    equipment: { id: "equipment-1", blade: "ALC" },
    ...overrides
  };
}

test("calculateWinRate handles empty, populated and draw-inclusive totals", () => {
  expect(calculateWinRate(0, 0)).toBe(0);
  expect(calculateWinRate(2, 3)).toBeCloseTo(66.7, 1);
  expect(calculateWinRate(1, 3)).toBeCloseTo(33.3, 1);
});

describe("calculateEquipmentStats", () => {
test("groups by equipment and excludes matches without equipment", () => {
  const result = calculateEquipmentStats([
    match({ id: "1", playedAt: new Date("2026-06-01T00:00:00Z"), result: "WIN" }),
    match({ id: "2", playedAt: new Date("2026-06-02T00:00:00Z"), result: "LOSE" }),
    match({
      id: "equipment-2-match",
      playedAt: new Date("2026-06-02T12:00:00Z"),
      result: "WIN",
      equipmentId: "equipment-2",
      equipment: { id: "equipment-2", blade: "7枚合板" }
    }),
    match({
      id: "3",
      playedAt: new Date("2026-06-03T00:00:00Z"),
      result: "WIN",
      equipmentId: null,
      equipment: null
    })
  ]);

  expect(result).toHaveLength(2);
  expect(result[0]).toEqual({
    equipmentId: "equipment-1",
    equipmentName: "ALC",
    totalMatches: 2,
    wins: 1,
    losses: 1,
    winRate: 50
  });
  expect(result[1]).toEqual({
    equipmentId: "equipment-2",
    equipmentName: "7枚合板",
    totalMatches: 1,
    wins: 1,
    losses: 0,
    winRate: 100
  });
});

test("returns an empty array when there are no matches", () => {
  expect(calculateEquipmentStats([])).toEqual([]);
});
});

describe("calculateOpponentStats", () => {
test("separates the same name by team and keeps the latest match", () => {
  const result = calculateOpponentStats([
    match({ id: "1", playedAt: new Date("2026-05-01T00:00:00Z"), result: "LOSE", memo: "旧メモ" }),
    match({ id: "2", playedAt: new Date("2026-06-01T00:00:00Z"), result: "WIN", memo: "最新メモ" }),
    match({
      id: "3",
      playedAt: new Date("2026-06-02T00:00:00Z"),
      result: "LOSE",
      opponentTeam: "別クラブ"
    })
  ]);

  expect(result).toHaveLength(2);
  const cityClub = result.find((entry) => entry.opponentTeam === "市民クラブ");
  expect(cityClub).toMatchObject({
    totalMatches: 2,
    wins: 1,
    losses: 1,
    winRate: 50,
    lastPlayedAt: "2026-06-01T00:00:00.000Z",
    lastMatchId: "2",
    latestMemo: "最新メモ"
  });
});

test("groups case and surrounding-space variants of an opponent name", () => {
  const result = calculateOpponentStats([
    match({ id: "1", playedAt: new Date("2026-06-01T00:00:00Z"), result: "WIN", opponentName: " Alice " }),
    match({ id: "2", playedAt: new Date("2026-06-02T00:00:00Z"), result: "LOSE", opponentName: "alice" })
  ]);

  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({ totalMatches: 2, wins: 1, losses: 1, winRate: 50 });
});
});

describe("calculateRecentWinRateTrend", () => {
test("uses the latest ten matches in chronological order", () => {
  const matches = Array.from({ length: 12 }, (_, index) =>
    match({
      id: String(index + 1),
      playedAt: new Date(`2026-06-${String(index + 1).padStart(2, "0")}T00:00:00Z`),
      result: index % 2 === 0 ? "WIN" : "LOSE"
    })
  );
  const result = calculateRecentWinRateTrend(matches);

  expect(result).toHaveLength(10);
  expect(result[0]?.playedAt).toBe("2026-06-03T00:00:00.000Z");
  expect(result[9]?.playedAt).toBe("2026-06-12T00:00:00.000Z");
  expect(result[0]?.cumulativeWinRate).toBe(100);
  expect(result[1]?.cumulativeWinRate).toBe(50);
});

test("works with fewer than ten and zero matches", () => {
  const twoMatches = [
    match({ id: "2", playedAt: new Date("2026-06-02T00:00:00Z"), result: "LOSE" }),
    match({ id: "1", playedAt: new Date("2026-06-01T00:00:00Z"), result: "WIN" })
  ];

  expect(calculateRecentWinRateTrend(twoMatches).map((point) => point.cumulativeWinRate)).toEqual([100, 50]);
  expect(calculateRecentWinRateTrend([])).toEqual([]);
});
});

describe("calculateDifficultOpponents", () => {
test("selects opponents with at least two matches and below 50 percent, lowest first", () => {
  const opponents = calculateOpponentStats([
    match({ id: "1", playedAt: new Date("2026-06-01T00:00:00Z"), result: "LOSE" }),
    match({ id: "2", playedAt: new Date("2026-06-02T00:00:00Z"), result: "WIN" }),
    match({
      id: "3",
      playedAt: new Date("2026-06-03T00:00:00Z"),
      result: "LOSE",
      opponentName: "田中",
      opponentTeam: null
    }),
    match({ id: "4", playedAt: new Date("2026-06-04T00:00:00Z"), result: "LOSE", opponentName: "田中", opponentTeam: null }),
    match({ id: "5", playedAt: new Date("2026-06-05T00:00:00Z"), result: "LOSE", opponentName: "鈴木", opponentTeam: null }),
    match({ id: "6", playedAt: new Date("2026-06-06T00:00:00Z"), result: "WIN", opponentName: "鈴木", opponentTeam: null }),
    match({ id: "7", playedAt: new Date("2026-06-07T00:00:00Z"), result: "WIN", opponentName: "鈴木", opponentTeam: null }),
    match({ id: "8", playedAt: new Date("2026-06-08T00:00:00Z"), result: "LOSE", opponentName: "伊藤", opponentTeam: null }),
    match({ id: "9", playedAt: new Date("2026-06-09T00:00:00Z"), result: "LOSE", opponentName: "伊藤", opponentTeam: null }),
    match({ id: "10", playedAt: new Date("2026-06-10T00:00:00Z"), result: "WIN", opponentName: "伊藤", opponentTeam: null })
  ]);
  const result = calculateDifficultOpponents(opponents);

  expect(result.map((entry) => entry.opponentName)).toEqual(["田中", "伊藤"]);
});

test("returns an empty array when nobody qualifies", () => {
  expect(calculateDifficultOpponents([])).toEqual([]);
});
});

test("calculateMonthlyPracticeStats aggregates counts and minutes for six months", () => {
  const result = calculateMonthlyPracticeStats(
    [
      { practicedAt: new Date("2026-05-01T00:00:00Z"), durationMin: 60 },
      { practicedAt: new Date("2026-05-03T00:00:00Z"), durationMin: 90 },
      { practicedAt: new Date("2026-06-01T00:00:00Z"), durationMin: 120 }
    ],
    new Date("2026-06-18T00:00:00Z")
  );

  expect(result).toHaveLength(6);
  expect(result.find((entry) => entry.month === "2026-05")).toEqual({
    month: "2026-05",
    practiceCount: 2,
    totalMinutes: 150
  });
  expect(result.find((entry) => entry.month === "2026-04")).toEqual({
    month: "2026-04",
    practiceCount: 0,
    totalMinutes: 0
  });
});
