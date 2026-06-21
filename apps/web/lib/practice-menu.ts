import type { PracticeMenuCategory } from "@/types/app";

export const practiceMenuCategoryLabels: Record<PracticeMenuCategory, string> = {
  SERVE: "サーブ",
  RECEIVE: "レシーブ",
  FOREHAND: "フォアハンド",
  BACKHAND: "バックハンド",
  FOOTWORK: "フットワーク",
  DRIVE: "ドライブ",
  BLOCK: "ブロック",
  GAME: "ゲーム練習",
  PHYSICAL: "フィジカル",
  MENTAL: "メンタル",
  OTHER: "その他"
};

export const practiceMenuCategoryOptions = Object.entries(practiceMenuCategoryLabels) as Array<
  [PracticeMenuCategory, string]
>;
