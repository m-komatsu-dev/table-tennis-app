import { apiRequest } from "@/api/client";
import type { MatchRecord, ScoreRow } from "@/types";

export type MatchInput = {
  playedAt: string;
  opponentName: string;
  opponentTeam?: string;
  matchType: "PRACTICE" | "OFFICIAL";
  result: "WIN" | "LOSE";
  scores: ScoreRow[];
  memo?: string;
};

export async function fetchMatchRecords() {
  return apiRequest<{ matchRecords: MatchRecord[] }>("/api/mobile/match");
}

export async function createMatchRecord(input: MatchInput) {
  return apiRequest<{ matchRecord: MatchRecord }>("/api/mobile/match", {
    method: "POST",
    body: JSON.stringify(input)
  });
}
