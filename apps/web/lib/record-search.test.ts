import assert from "node:assert/strict";
import test from "node:test";
import {
  SEARCH_TEXT_MAX_LENGTH,
  buildMatchWhere,
  buildPracticeWhere,
  parseMatchSearchParams,
  parsePracticeSearchParams
} from "./record-search";

test("practice search params trim strings and ignore empty values", () => {
  assert.deepEqual(
    parsePracticeSearchParams({
      q: "  サーブ  ",
      location: "   ",
      from: "2026-06-01",
      to: undefined
    }),
    { q: "サーブ", location: undefined, from: "2026-06-01", to: undefined }
  );
});

test("search params ignore invalid dates and overly long strings", () => {
  assert.deepEqual(
    parsePracticeSearchParams({
      q: "a".repeat(SEARCH_TEXT_MAX_LENGTH + 1),
      from: "2026-02-30",
      to: "not-a-date"
    }),
    { q: undefined, location: undefined, from: undefined, to: undefined }
  );
});

test("match search params ignore unsupported enum values", () => {
  assert.deepEqual(
    parseMatchSearchParams({ result: "DRAW", type: "TOURNAMENT" }),
    {
      opponent: undefined,
      team: undefined,
      from: undefined,
      to: undefined,
      result: undefined,
      type: undefined
    }
  );
});

test("match search params trim valid enum and date values", () => {
  assert.deepEqual(
    parseMatchSearchParams({ result: " WIN ", type: " OFFICIAL ", from: " 2026-06-01 " }),
    {
      opponent: undefined,
      team: undefined,
      from: "2026-06-01",
      to: undefined,
      result: "WIN",
      type: "OFFICIAL"
    }
  );
});

test("practice where always scopes by user and combines keyword, location and date range", () => {
  assert.deepEqual(
    buildPracticeWhere("user-1", {
      q: "ドライブ",
      location: "体育館",
      from: "2026-06-01",
      to: "2026-06-30"
    }),
    {
      userId: "user-1",
      practicedAt: {
        gte: new Date("2026-06-01T00:00:00.000Z"),
        lte: new Date("2026-06-30T23:59:59.999Z")
      },
      location: { contains: "体育館", mode: "insensitive" },
      OR: [
        { content: { contains: "ドライブ", mode: "insensitive" } },
        { location: { contains: "ドライブ", mode: "insensitive" } }
      ]
    }
  );
});

test("match where ignores absent filters and maps supported filters", () => {
  assert.deepEqual(
    buildMatchWhere("user-2", {
      opponent: "佐藤",
      team: "熊本高校",
      result: "WIN",
      type: "OFFICIAL",
      to: "2026-06-20"
    }),
    {
      userId: "user-2",
      playedAt: { lte: new Date("2026-06-20T23:59:59.999Z") },
      opponentName: { contains: "佐藤", mode: "insensitive" },
      opponentTeam: { contains: "熊本高校", mode: "insensitive" },
      result: "WIN",
      matchType: "OFFICIAL"
    }
  );
});

test("empty filters still retain the user boundary", () => {
  assert.deepEqual(buildPracticeWhere("user-1", {}), { userId: "user-1" });
  assert.deepEqual(buildMatchWhere("user-2", {}), { userId: "user-2" });
});
