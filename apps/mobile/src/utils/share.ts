import type { MatchRecord, PracticeLog } from "@/types";
import { formatDate, formatScores, matchTypeLabels, resultLabels } from "@/components/format";
import { formatDuration, formatWinRate, type AnalyticsSummary, type PracticeMenuSummary } from "@/utils/analytics";

export const shareTags = "#卓球記録 #卓球練習";
export const matchShareTags = "#卓球記録 #卓球試合";

export function shortenShareText(value?: string | null, maxLength = 72) {
  const text = value?.replace(/\s+/g, " ").trim();

  if (!text) {
    return null;
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1)}…`;
}

export function buildPracticeShareText(practice: PracticeLog) {
  const lines = [
    "今日の練習を記録しました。",
    `${practice.practiceMenu?.title ?? practice.content ?? "卓球練習"}を中心に${practice.durationMin}分練習しました。`
  ];
  const memo = shortenShareText(practice.memo);

  if (memo) {
    lines.push(`振り返り: ${memo}`);
  }

  lines.push("", shareTags);
  return lines.join("\n");
}

export function buildMatchShareText(match: MatchRecord, includeOpponentName = false) {
  const lines = [
    "今日の試合を記録しました。",
    `結果: ${resultLabels[match.result]}`,
    `スコア: ${formatScores(match.scores) || "記録あり"}`,
    `試合種別: ${matchTypeLabels[match.matchType]}`
  ];

  if (includeOpponentName) {
    lines.push(`相手: ${match.opponentName}`);
  } else {
    lines.push("相手: 非公開");
  }

  const memo = shortenShareText(match.memo);

  if (memo) {
    lines.push(`振り返り: ${memo}`);
  }

  lines.push("", matchShareTags);
  return lines.join("\n");
}

export function buildSummaryShareText({
  periodLabel,
  summary,
  topMenu,
  coachComment
}: {
  periodLabel: string;
  summary: AnalyticsSummary;
  topMenu?: PracticeMenuSummary;
  coachComment?: string;
}) {
  const lines = [
    "今週の卓球まとめ",
    `期間: ${periodLabel}`,
    `練習時間: ${formatDuration(summary.totalPracticeMinutes)}`,
    `練習回数: ${summary.totalPractices}回`,
    `試合成績: ${summary.wins}勝${summary.losses}敗${summary.draws > 0 ? `${summary.draws}分` : ""}`,
    `勝率: ${formatWinRate(summary.winRate)}`,
    `重点練習: ${topMenu?.name ?? "記録から集計中"}`
  ];

  if (coachComment) {
    lines.push(`AIコーチの一言: ${coachComment}`);
  }

  lines.push("", shareTags);
  return lines.join("\n");
}

export function formatShareDateRange(start: Date, end: Date) {
  return `${formatDate(start.toISOString())}〜${formatDate(end.toISOString())}`;
}
