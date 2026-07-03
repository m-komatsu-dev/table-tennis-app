import type { ScoreRow } from "@/types";

export const levelLabels = {
  BEGINNER: "初心者",
  INTERMEDIATE: "中級者",
  ADVANCED: "上級者",
  COMPETITIVE: "競技者",
  PRO: "プロ"
} as const;

export const genderLabels = {
  MALE: "男性",
  FEMALE: "女性",
  OTHER: "その他",
  NO_ANSWER: "回答しない"
} as const;

export const matchTypeLabels = {
  PRACTICE: "練習試合",
  OFFICIAL: "公式試合",
  TOURNAMENT: "公式試合"
} as const;

export const resultLabels = {
  WIN: "勝利",
  LOSE: "敗北",
  DRAW: "引き分け"
} as const;

export const partnerPostTypeLabels = {
  PRACTICE: "練習相手",
  MATCH: "試合相手"
} as const;

export const partnerPostStatusLabels = {
  OPEN: "募集中",
  CLOSED: "締め切り"
} as const;

export const partnerRequestStatusLabels = {
  PENDING: "未対応",
  ACCEPTED: "承認",
  DECLINED: "見送り"
} as const;

export function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

export function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${hours}:${minutes}`;
}

export function todayInputValue() {
  const date = new Date();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatSetCount(scores: ScoreRow[]) {
  const count = scores.reduce(
    (acc, score) => {
      if (score.me > score.opp) {
        acc.me += 1;
      } else if (score.me < score.opp) {
        acc.opp += 1;
      }

      return acc;
    },
    { me: 0, opp: 0 }
  );

  return `${count.me} - ${count.opp}`;
}

export function formatScores(scores: ScoreRow[]) {
  return scores.map((score) => `${score.me}-${score.opp}`).join(", ");
}
