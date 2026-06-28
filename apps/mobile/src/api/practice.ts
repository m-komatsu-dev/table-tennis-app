import { apiRequest } from "@/api/client";
import type { PracticeLog } from "@/types";

export type PracticeInput = {
  practicedAt: string;
  durationMin: number;
  location?: string;
  content?: string;
  memo?: string;
  practiceMenuId?: string | null;
  isPublic?: boolean;
};

export async function fetchPracticeLogs() {
  return apiRequest<{ practiceLogs: PracticeLog[] }>("/api/mobile/practice");
}

export async function fetchPracticeLog(id: string) {
  return apiRequest<{ practiceLog: PracticeLog }>(`/api/mobile/practice/${id}`);
}

export async function createPracticeLog(input: PracticeInput) {
  return apiRequest<{ practiceLog: PracticeLog }>("/api/mobile/practice", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updatePracticeLog(id: string, input: PracticeInput) {
  return apiRequest<{ practiceLog: PracticeLog }>(`/api/mobile/practice/${id}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export async function deletePracticeLog(id: string) {
  return apiRequest<{ ok: true }>(`/api/mobile/practice/${id}`, {
    method: "DELETE"
  });
}
