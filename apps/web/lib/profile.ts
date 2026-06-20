import type { ProfileView } from "@/types/app";

export const profileLevelNames: Record<ProfileView["level"], string> = {
  BEGINNER: "初心者",
  INTERMEDIATE: "初級者",
  ADVANCED: "中級者",
  COMPETITIVE: "上級者",
  PRO: "プロ"
};

export const profileLevelOptions: Array<{ value: ProfileView["level"]; label: string }> = [
  { value: "BEGINNER", label: "初心者（地区・市大会レベル）" },
  { value: "INTERMEDIATE", label: "初級者（地区・市大会ランカー〜都道府県大会レベル）" },
  { value: "ADVANCED", label: "中級者（県大会ランカー〜地方大会（関東、関西、四国、東北、等）レベル）" },
  {
    value: "COMPETITIVE",
    label: "上級者（地方大会（関東、関西、四国、東北、等）ランカー〜全国大会レベル）"
  },
  { value: "PRO", label: "プロ（全国大会ランカー〜）" }
];
