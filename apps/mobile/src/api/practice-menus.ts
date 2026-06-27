import { apiRequest } from "@/api/client";
import type { PracticeMenu, PracticeMenuCategory } from "@/types";

export type PracticeMenuInput = {
  title: string;
  description?: string | null;
  goal?: string | null;
  totalMinutes?: number | null;
  items: {
    title: string;
    description?: string | null;
    category: PracticeMenuCategory;
    durationMin?: number | null;
    order: number;
  }[];
};

export async function fetchPracticeMenus() {
  return apiRequest<{ practiceMenus: PracticeMenu[] }>("/api/mobile/practice-menus");
}

export async function fetchPracticeMenu(id: string) {
  return apiRequest<{ practiceMenu: PracticeMenu }>(`/api/mobile/practice-menus/${id}`);
}

export async function createPracticeMenu(input: PracticeMenuInput) {
  return apiRequest<{ practiceMenu: PracticeMenu }>("/api/mobile/practice-menus", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updatePracticeMenu(id: string, input: PracticeMenuInput) {
  return apiRequest<{ practiceMenu: PracticeMenu }>(`/api/mobile/practice-menus/${id}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export async function deletePracticeMenu(id: string) {
  return apiRequest<{ ok: true }>(`/api/mobile/practice-menus/${id}`, {
    method: "DELETE"
  });
}
