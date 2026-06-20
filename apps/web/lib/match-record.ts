import type { ScoreRow } from "@/types/app";

export const matchTypeLabels = {
  PRACTICE: "練習試合",
  OFFICIAL: "公式試合",
  TOURNAMENT: "公式試合"
} as const;

export const matchResultLabels = {
  WIN: "勝利",
  LOSE: "敗北",
  DRAW: "引き分け"
} as const;

export function calculateSetCount(scores: ScoreRow[]) {
  return scores.reduce(
    (count, score) => {
      if (score.me > score.opp) {
        count.me += 1;
      } else if (score.me < score.opp) {
        count.opp += 1;
      }

      return count;
    },
    { me: 0, opp: 0 }
  );
}

export function formatSetCount(scores: ScoreRow[]) {
  const count = calculateSetCount(scores);
  return `${count.me} - ${count.opp}`;
}
