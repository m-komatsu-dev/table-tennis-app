import assert from "node:assert/strict";
import test from "node:test";
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

test("calculateWinRate handles empty and populated totals", () => {
  assert.equal(calculateWinRate(0, 0), 0);
  assert.equal(calculateWinRate(2, 3), (2 / 3) * 100);
});

test("calculateEquipmentStats groups only matches with equipment", () => {
  const result = calculateEquipmentStats([
    match({ id: "1", playedAt: new Date("2026-06-01T00:00:00Z"), result: "WIN" }),
    match({ id: "2", playedAt: new Date("2026-06-02T00:00:00Z"), result: "LOSE" }),
    match({
      id: "3",
      playedAt: new Date("2026-06-03T00:00:00Z"),
      result: "WIN",
      equipmentId: null,
      equipment: null
    })
  ]);

  assert.equal(result.length, 1);
  assert.deepEqual(result[0], {
    equipmentId: "equipment-1",
    equipmentName: "ALC",
    totalMatches: 2,
    wins: 1,
    losses: 1,
    winRate: 50
  });
});

test("calculateOpponentStats separates the same name by team and keeps the latest match", () => {
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

  assert.equal(result.length, 2);
  const cityClub = result.find((entry) => entry.opponentTeam === "市民クラブ");
  assert.equal(cityClub?.totalMatches, 2);
  assert.equal(cityClub?.wins, 1);
  assert.equal(cityClub?.losses, 1);
  assert.equal(cityClub?.winRate, 50);
  assert.equal(cityClub?.lastMatchId, "2");
  assert.equal(cityClub?.latestMemo, "最新メモ");
});

test("calculateRecentWinRateTrend uses the latest ten matches in chronological order", () => {
  const matches = Array.from({ length: 12 }, (_, index) =>
    match({
      id: String(index + 1),
      playedAt: new Date(`2026-06-${String(index + 1).padStart(2, "0")}T00:00:00Z`),
      result: index % 2 === 0 ? "WIN" : "LOSE"
    })
  );
  const result = calculateRecentWinRateTrend(matches);

  assert.equal(result.length, 10);
  assert.equal(result[0]?.playedAt, "2026-06-03T00:00:00.000Z");
  assert.equal(result[9]?.playedAt, "2026-06-12T00:00:00.000Z");
  assert.equal(result[0]?.cumulativeWinRate, 100);
  assert.equal(result[1]?.cumulativeWinRate, 50);
});

test("calculateDifficultOpponents selects opponents with two matches and below 50 percent", () => {
  const opponents = calculateOpponentStats([
    match({ id: "1", playedAt: new Date("2026-06-01T00:00:00Z"), result: "LOSE" }),
    match({ id: "2", playedAt: new Date("2026-06-02T00:00:00Z"), result: "LOSE" }),
    match({
      id: "3",
      playedAt: new Date("2026-06-03T00:00:00Z"),
      result: "LOSE",
      opponentName: "田中",
      opponentTeam: null
    })
  ]);
  const result = calculateDifficultOpponents(opponents);

  assert.equal(result.length, 1);
  assert.equal(result[0]?.opponentName, "佐藤");
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

  assert.equal(result.length, 6);
  assert.deepEqual(result.find((entry) => entry.month === "2026-05"), {
    month: "2026-05",
    practiceCount: 2,
    totalMinutes: 150
  });
});
