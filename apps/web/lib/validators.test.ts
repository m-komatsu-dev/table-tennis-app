import assert from "node:assert/strict";
import test from "node:test";
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

  assert.equal(result.success, false);
});

test("profileSchema rejects invalid enum values", () => {
  const result = profileSchema.safeParse({
    name: "Sample",
    club: "",
    level: "EXPERT",
    playStyle: "",
    avatarUrl: ""
  });

  assert.equal(result.success, false);
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

  assert.equal(result.success, true);
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

  assert.equal(result.success, false);
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

  assert.equal(result.success, true);
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

  assert.equal(result.success, true);
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

  assert.equal(result.success, true);
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

  assert.equal(result.success, false);
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

  assert.equal(legacyType.success, false);
  assert.equal(legacyResult.success, false);
});

const validMenuItem = {
  title: "ショートサーブ",
  description: "下回転を短く出す",
  category: "SERVE",
  durationMin: 15,
  order: 0
};

test("practiceMenuSchema accepts a valid menu with one or more items", () => {
  const result = practiceMenuSchema.safeParse({
    title: "サーブ練習",
    description: "基本メニュー",
    goal: "回転量を増やす",
    totalMinutes: 60,
    items: [validMenuItem]
  });

  assert.equal(result.success, true);
});

test("practiceMenuSchema requires at least one item", () => {
  const result = practiceMenuSchema.safeParse({ title: "空のメニュー", items: [] });
  assert.equal(result.success, false);
});

test("practiceMenuItemSchema rejects an unsupported category", () => {
  const result = practiceMenuItemSchema.safeParse({ ...validMenuItem, category: "SMASH" });
  assert.equal(result.success, false);
});

test("practiceMenuSchema checks totalMinutes range", () => {
  assert.equal(practiceMenuSchema.safeParse({ title: "短すぎる", totalMinutes: 0, items: [validMenuItem] }).success, false);
  assert.equal(practiceMenuSchema.safeParse({ title: "長すぎる", totalMinutes: 601, items: [validMenuItem] }).success, false);
});

test("practiceMenuItemSchema checks durationMin range", () => {
  assert.equal(practiceMenuItemSchema.safeParse({ ...validMenuItem, durationMin: 0 }).success, false);
  assert.equal(practiceMenuItemSchema.safeParse({ ...validMenuItem, durationMin: 301 }).success, false);
});
