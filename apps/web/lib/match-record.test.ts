import assert from "node:assert/strict";
import test from "node:test";
import { calculateSetCount, formatSetCount } from "./match-record";

test("set count is calculated from each set score", () => {
  const scores = [
    { set: 1, me: 11, opp: 3 },
    { set: 2, me: 7, opp: 11 },
    { set: 3, me: 9, opp: 11 },
    { set: 4, me: 14, opp: 12 },
    { set: 5, me: 11, opp: 9 }
  ];

  assert.deepEqual(calculateSetCount(scores), { me: 3, opp: 2 });
  assert.equal(formatSetCount(scores), "3 - 2");
});
