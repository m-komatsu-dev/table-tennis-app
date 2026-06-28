import { ApiError, apiRequest, apiStatus } from "@/api/client";
import type { MatchRecord, PracticeLog } from "@/types";
import { buildAnalyticsSummary, getOpponentRanking, getPracticeMenuBreakdown } from "@/utils/analytics";

export type AiCoachResult = {
  goodPoints: string[];
  issues: string[];
  nextPractice: string[];
  advice: string;
};

type AiCoachPayload = {
  practiceRecords: {
    date: string;
    durationMinutes: number;
    content: string | null;
    memo: string | null;
    practiceMenuTitle: string | null;
  }[];
  matchRecords: {
    date: string;
    opponentName: string | null;
    result: MatchRecord["result"];
    score: string | null;
    memo: string | null;
  }[];
  summary: {
    totalPracticeMinutes: number;
    totalPracticeCount: number;
    totalMatchCount: number;
    winRate: number;
    frequentOpponents: string[];
    practiceMenuMinutes: { name: string; minutes: number }[];
  };
};

function toDateOnly(value: string) {
  return value.slice(0, 10);
}

function toMatchScore(scores: MatchRecord["scores"]) {
  if (scores.length === 0) {
    return null;
  }

  const setCount = scores.reduce(
    (count, score) => {
      if (score.me > score.opp) count.me += 1;
      if (score.opp > score.me) count.opp += 1;
      return count;
    },
    { me: 0, opp: 0 }
  );

  return `${setCount.me}-${setCount.opp}`;
}

export function buildAiCoachPayload(practiceLogs: PracticeLog[], matchRecords: MatchRecord[]): AiCoachPayload {
  const sortedPractices = [...practiceLogs].sort((a, b) => b.practicedAt.localeCompare(a.practicedAt));
  const sortedMatches = [...matchRecords].sort((a, b) => b.playedAt.localeCompare(a.playedAt));
  const summary = buildAnalyticsSummary(practiceLogs, matchRecords, "all");

  return {
    practiceRecords: sortedPractices.slice(0, 10).map((practice) => ({
      date: toDateOnly(practice.practicedAt),
      durationMinutes: practice.durationMin,
      content: practice.content,
      memo: practice.memo,
      practiceMenuTitle: practice.practiceMenu?.title ?? null
    })),
    matchRecords: sortedMatches.slice(0, 10).map((match) => ({
      date: toDateOnly(match.playedAt),
      opponentName: match.opponentName,
      result: match.result,
      score: toMatchScore(match.scores),
      memo: match.memo
    })),
    summary: {
      totalPracticeMinutes: summary.totalPracticeMinutes,
      totalPracticeCount: summary.totalPractices,
      totalMatchCount: summary.totalMatches,
      winRate: Math.round(summary.winRate * 10) / 10,
      frequentOpponents: getOpponentRanking(matchRecords, 5).map((opponent) => opponent.name),
      practiceMenuMinutes: getPracticeMenuBreakdown(practiceLogs, 8)
    }
  };
}

export async function generateAiCoachAdvice(practiceLogs: PracticeLog[], matchRecords: MatchRecord[]) {
  try {
    return await apiRequest<{ result: AiCoachResult }>("/api/mobile/ai/coach", {
      method: "POST",
      body: JSON.stringify(buildAiCoachPayload(practiceLogs, matchRecords))
    });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 429) {
        throw new Error("少し時間をおいてから再度お試しください");
      }

      if (error.status >= 500) {
        throw new Error("AIコーチの生成に失敗しました");
      }

      if (error.status === apiStatus.network) {
        throw new Error("サーバーに接続できません");
      }
    }

    throw error;
  }
}
