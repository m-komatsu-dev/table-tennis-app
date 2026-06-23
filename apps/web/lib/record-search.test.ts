import { expect, test } from "vitest";
import {
  SEARCH_TEXT_MAX_LENGTH,
  buildMatchWhere,
  buildPracticeWhere,
  parseMatchSearchParams,
  parsePracticeSearchParams
} from "./record-search";

test("practice search params trim strings and ignore empty values", () => {
  expect(
    parsePracticeSearchParams({
      q: "  サーブ  ",
      location: "   ",
      from: "2026-06-01",
      to: undefined
    }),
  ).toEqual({ q: "サーブ", location: undefined, from: "2026-06-01", to: undefined });
});

test("search params ignore invalid dates and overly long strings", () => {
  expect(
    parsePracticeSearchParams({
      q: "a".repeat(SEARCH_TEXT_MAX_LENGTH + 1),
      from: "2026-02-30",
      to: "not-a-date"
    }),
  ).toEqual({ q: undefined, location: undefined, from: undefined, to: undefined });
});

test("match search params ignore unsupported enum values", () => {
  expect(
    parseMatchSearchParams({ result: "DRAW", type: "TOURNAMENT" }),
  ).toEqual({
      opponent: undefined,
      team: undefined,
      from: undefined,
      to: undefined,
      result: undefined,
      type: undefined
  });
});

test("match search params trim valid enum and date values", () => {
  expect(
    parseMatchSearchParams({ result: " WIN ", type: " OFFICIAL ", from: " 2026-06-01 " }),
  ).toEqual({
      opponent: undefined,
      team: undefined,
      from: "2026-06-01",
      to: undefined,
      result: "WIN",
      type: "OFFICIAL"
  });
});

test.each(["WIN", "LOSE"])("%s is accepted as a match result", (result) => {
  expect(parseMatchSearchParams({ result }).result).toBe(result);
});

test.each(["PRACTICE", "OFFICIAL"])("%s is accepted as a match type", (type) => {
  expect(parseMatchSearchParams({ type }).type).toBe(type);
});

test("only the first URL query value is interpreted", () => {
  expect(parseMatchSearchParams({ result: ["WIN", "LOSE"], opponent: ["佐藤", "田中"] })).toMatchObject({
    result: "WIN",
    opponent: "佐藤"
  });
});

test("practice where always scopes by user and combines keyword, location and date range", () => {
  expect(
    buildPracticeWhere("user-1", {
      q: "ドライブ",
      location: "体育館",
      from: "2026-06-01",
      to: "2026-06-30"
    }),
  ).toEqual({
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
  });
});

test("match where ignores absent filters and maps supported filters", () => {
  expect(
    buildMatchWhere("user-2", {
      opponent: "佐藤",
      team: "熊本高校",
      result: "WIN",
      type: "OFFICIAL",
      to: "2026-06-20"
    }),
  ).toEqual({
      userId: "user-2",
      playedAt: { lte: new Date("2026-06-20T23:59:59.999Z") },
      opponentName: { contains: "佐藤", mode: "insensitive" },
      opponentTeam: { contains: "熊本高校", mode: "insensitive" },
      result: "WIN",
      matchType: "OFFICIAL"
  });
});

test("empty filters still retain the user boundary", () => {
  expect(buildPracticeWhere("user-1", {})).toEqual({ userId: "user-1" });
  expect(buildMatchWhere("user-2", {})).toEqual({ userId: "user-2" });
});
