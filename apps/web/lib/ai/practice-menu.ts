import type { AiPracticeMenuSuggestion } from "./schemas";

export function toPracticeMenuCreateData(userId: string, suggestion: AiPracticeMenuSuggestion) {
  return {
    userId,
    title: suggestion.title,
    description: suggestion.description?.trim() || null,
    goal: suggestion.goal,
    totalMinutes: suggestion.totalMinutes,
    isTemplate: true,
    items: {
      create: suggestion.items.map((item) => ({
        title: item.title,
        description: item.description?.trim() || null,
        category: item.category,
        durationMin: item.durationMin,
        order: item.order
      }))
    }
  };
}
