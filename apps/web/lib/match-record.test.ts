import { describe, expect, test } from "vitest";
import { calculateSetCount, formatSetCount } from "./match-record";

describe("match score calculation", () => {
test("11-3, 11-5, 11-7 is formatted as 3 - 0", () => {
  const scores = [
    { set: 1, me: 11, opp: 3 },
    { set: 2, me: 11, opp: 5 },
    { set: 3, me: 11, opp: 7 }
  ];

  expect(calculateSetCount(scores)).toEqual({ me: 3, opp: 0 });
  expect(formatSetCount(scores)).toBe("3 - 0");
});

test("five sets are calculated as 3 - 2", () => {
  const scores = [
    { set: 1, me: 11, opp: 3 },
    { set: 2, me: 7, opp: 11 },
    { set: 3, me: 11, opp: 9 },
    { set: 4, me: 9, opp: 11 },
    { set: 5, me: 11, opp: 8 }
  ];

  expect(calculateSetCount(scores)).toEqual({ me: 3, opp: 2 });
  expect(formatSetCount(scores)).toBe("3 - 2");
});

test("tied set scores are not added to either game count", () => {
  const scores = [
    { set: 1, me: 11, opp: 8 },
    { set: 2, me: 9, opp: 9 },
    { set: 3, me: 7, opp: 11 }
  ];

  expect(calculateSetCount(scores)).toEqual({ me: 1, opp: 1 });
});

test("an empty score list is 0 - 0", () => {
  expect(calculateSetCount([])).toEqual({ me: 0, opp: 0 });
  expect(formatSetCount([])).toBe("0 - 0");
});

test("malformed score rows are ignored without throwing", () => {
  const malformed = [
    null,
    undefined,
    { set: 1, me: Number.NaN, opp: 11 },
    { set: 2, me: 11 },
    { set: 3, me: 11, opp: 8 }
  ];

  expect(() => calculateSetCount(malformed)).not.toThrow();
  expect(calculateSetCount(malformed)).toEqual({ me: 1, opp: 0 });
});
});
