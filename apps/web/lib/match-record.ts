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

type SafeScoreRow = Partial<ScoreRow> | null | undefined;

export function calculateSetCount(scores: readonly SafeScoreRow[]) {
  return scores.reduce<{ me: number; opp: number }>(
    (count, score) => {
      if (
        !score ||
        typeof score.me !== "number" ||
        typeof score.opp !== "number" ||
        !Number.isFinite(score.me) ||
        !Number.isFinite(score.opp)
      ) {
        return count;
      }

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

export function formatSetCount(scores: readonly SafeScoreRow[]) {
  const count = calculateSetCount(scores);
  return `${count.me} - ${count.opp}`;
}
