import { apiRequest } from "@/api/client";
import type { FeedbackCategory, FeedbackListItem } from "@/types";

export type CreateFeedbackInput = {
  category: FeedbackCategory;
  subject: string;
  body: string;
  sourcePath?: string | null;
};

export async function createFeedback(input: CreateFeedbackInput) {
  return apiRequest<{ feedback: FeedbackListItem }>("/api/mobile/feedback", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function fetchMyFeedbacks() {
  return apiRequest<{ feedbacks: FeedbackListItem[] }>("/api/mobile/feedback/mine");
}
