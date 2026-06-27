import { apiRequest } from "@/api/client";
import type { PracticeLog } from "@/types";

export type PracticeInput = {
  practicedAt: string;
  durationMin: number;
  location?: string;
  content?: string;
  practiceMenuId?: string | null;
};

export async function fetchPracticeLogs() {
  return apiRequest<{ practiceLogs: PracticeLog[] }>("/api/mobile/practice");
}

export async function createPracticeLog(input: PracticeInput) {
  return apiRequest<{ practiceLog: PracticeLog }>("/api/mobile/practice", {
    method: "POST",
    body: JSON.stringify(input)
  });
}
