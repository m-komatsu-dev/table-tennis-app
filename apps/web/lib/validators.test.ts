import assert from "node:assert/strict";
import test from "node:test";
import { matchSchema, practiceSchema, profileSchema } from "./validators";

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
    memo: ""
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
