import { apiRequest } from "@/api/client";
import type { PracticeMenu } from "@/types";

export async function fetchPracticeMenus() {
  return apiRequest<{ practiceMenus: PracticeMenu[] }>("/api/mobile/practice-menus");
}
