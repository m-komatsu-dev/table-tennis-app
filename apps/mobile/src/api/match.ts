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

export async function fetchMatchRecord(id: string) {
  return apiRequest<{ matchRecord: MatchRecord }>(`/api/mobile/match/${id}`);
}

export async function createMatchRecord(input: MatchInput) {
  return apiRequest<{ matchRecord: MatchRecord }>("/api/mobile/match", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateMatchRecord(id: string, input: MatchInput) {
  return apiRequest<{ matchRecord: MatchRecord }>(`/api/mobile/match/${id}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export async function deleteMatchRecord(id: string) {
  return apiRequest<{ ok: true }>(`/api/mobile/match/${id}`, {
    method: "DELETE"
  });
}
