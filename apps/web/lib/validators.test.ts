import { describe, expect, test } from "vitest";
import {
  equipmentSchema,
  matchSchema,
  practiceMenuItemSchema,
  practiceMenuSchema,
  practiceSchema,
  profileSchema
} from "./validators";

test("practiceSchema rejects missing date and out-of-range duration", () => {
  const result = practiceSchema.safeParse({
    practicedAt: "",
    durationMin: 1441,
    location: "",
    content: "",
    equipmentId: null
  });

  expect(result.success).toBe(false);
});

test("profileSchema rejects invalid enum values", () => {
  const result = profileSchema.safeParse({
    name: "Sample",
    club: "",
    level: "EXPERT",
    playStyle: "",
    avatarUrl: ""
  });

  expect(result.success).toBe(false);
});

test("profileSchema accepts the fifth level, gender and image data URL", () => {
  const result = profileSchema.safeParse({
    name: "Sample",
    club: "卓球クラブ",
    level: "PRO",
    gender: "NO_ANSWER",
    playStyle: "右シェーク",
    avatarUrl: "data:image/png;base64,aGVsbG8="
  });

  expect(result.success).toBe(true);
});

test("profileSchema rejects non-image data URLs", () => {
  const result = profileSchema.safeParse({
    name: "Sample",
    club: "",
    level: "BEGINNER",
    gender: "OTHER",
    playStyle: "",
    avatarUrl: "data:text/plain;base64,aGVsbG8="
  });

  expect(result.success).toBe(false);
});

test("equipmentSchema accepts rubber thickness and grip details", () => {
  const result = equipmentSchema.safeParse({
    blade: "インナーフォース ALC",
    gripType: "フレア",
    rubberFh: "テナジー05",
    rubberFhThickness: "特厚",
    rubberBh: "ディグニクス05",
    rubberBhThickness: "2.1mm",
    isCurrent: true
  });

  expect(result.success).toBe(true);
});

test("matchSchema accepts a valid score JSON shape", () => {
  const result = matchSchema.safeParse({
    playedAt: "2026-06-18",
    opponentName: "佐藤",
    matchType: "PRACTICE",
    scores: [
      { set: 1, me: 11, opp: 8 },
      { set: 2, me: 9, opp: 11 },
      { set: 3, me: 11, opp: 7 }
    ],
    result: "WIN",
    memo: "",
    equipmentId: "123e4567-e89b-12d3-a456-426614174000"
  });

  expect(result.success).toBe(true);
});

test("matchSchema accepts an unselected equipment value", () => {
  const result = matchSchema.safeParse({
    playedAt: "2026-06-18",
    opponentName: "佐藤",
    matchType: "PRACTICE",
    scores: [{ set: 1, me: 11, opp: 8 }],
    result: "WIN",
    memo: "",
    equipmentId: null
  });

  expect(result.success).toBe(true);
});

test("matchSchema rejects duplicate score set numbers", () => {
  const result = matchSchema.safeParse({
    playedAt: "2026-06-18",
    opponentName: "佐藤",
    matchType: "PRACTICE",
    scores: [
      { set: 1, me: 11, opp: 8 },
      { set: 1, me: 11, opp: 7 }
    ],
    result: "WIN",
    memo: ""
  });

  expect(result.success).toBe(false);
});

test("matchSchema only accepts the supported match type and result values", () => {
  const legacyType = matchSchema.safeParse({
    playedAt: "2026-06-18",
    opponentName: "佐藤",
    opponentTeam: "卓球クラブ",
    matchType: "TOURNAMENT",
    scores: [{ set: 1, me: 11, opp: 8 }],
    result: "WIN",
    memo: ""
  });
  const legacyResult = matchSchema.safeParse({
    playedAt: "2026-06-18",
    opponentName: "佐藤",
    opponentTeam: "卓球クラブ",
    matchType: "OFFICIAL",
    scores: [{ set: 1, me: 11, opp: 8 }],
    result: "DRAW",
    memo: ""
  });

  expect(legacyType.success).toBe(false);
  expect(legacyResult.success).toBe(false);
});

const validMenuItem = {
  title: "ショートサーブ",
  description: "下回転を短く出す",
  category: "SERVE",
  durationMin: 15,
  order: 0
};

describe("practice menu validation", () => {
test("accepts a valid menu with one or more items", () => {
  const result = practiceMenuSchema.safeParse({
    title: "サーブ練習",
    description: "基本メニュー",
    goal: "回転量を増やす",
    totalMinutes: 60,
    items: [validMenuItem]
  });

  expect(result.success).toBe(true);
});

test("rejects an empty or overly long title", () => {
  expect(practiceMenuSchema.safeParse({ title: "", items: [validMenuItem] }).success).toBe(false);
  expect(practiceMenuSchema.safeParse({ title: "a".repeat(101), items: [validMenuItem] }).success).toBe(false);
});

test("requires at least one item", () => {
  const result = practiceMenuSchema.safeParse({ title: "空のメニュー", items: [] });
  expect(result.success).toBe(false);
});

test("rejects an unsupported category", () => {
  const result = practiceMenuItemSchema.safeParse({ ...validMenuItem, category: "SMASH" });
  expect(result.success).toBe(false);
});

test("checks totalMinutes range", () => {
  expect(practiceMenuSchema.safeParse({ title: "短すぎる", totalMinutes: 0, items: [validMenuItem] }).success).toBe(false);
  expect(practiceMenuSchema.safeParse({ title: "長すぎる", totalMinutes: 601, items: [validMenuItem] }).success).toBe(false);
});

test("checks durationMin range", () => {
  expect(practiceMenuItemSchema.safeParse({ ...validMenuItem, durationMin: 0 }).success).toBe(false);
  expect(practiceMenuItemSchema.safeParse({ ...validMenuItem, durationMin: 301 }).success).toBe(false);
});
});
