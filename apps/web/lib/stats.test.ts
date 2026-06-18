import assert from "node:assert/strict";
import test from "node:test";
import { buildMonthlyStats, calculateWinRate, getMonthlyStatsRange } from "./stats";

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

test("calculateWinRate returns 0 when no matches exist", () => {
  assert.equal(calculateWinRate(0, 0), 0);
});

test("calculateWinRate returns percentage", () => {
  assert.equal(calculateWinRate(3, 4), 75);
});

test("getMonthlyStatsRange creates a six month window ending after the current month", () => {
  const range = getMonthlyStatsRange(new Date("2026-06-18T00:00:00.000Z"));

  assert.equal(localDateKey(range.firstMonth), "2026-01-01");
  assert.equal(localDateKey(range.afterLastMonth), "2026-07-01");
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

  assert.equal(result.length, 6);
  assert.equal(may?.practiceMinutes, 150);
  assert.equal(may?.matches, 2);
  assert.equal(may?.wins, 1);
  assert.equal(may?.winRate, 50);
  assert.equal(june?.practiceMinutes, 120);
  assert.equal(june?.matches, 1);
  assert.equal(june?.winRate, 0);
});
