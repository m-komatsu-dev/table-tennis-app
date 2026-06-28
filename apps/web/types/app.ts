export type EquipmentView = {
  id: string;
  blade: string;
  rubberFh: string | null;
  rubberFhThickness: string | null;
  rubberBh: string | null;
  rubberBhThickness: string | null;
  gripType: string | null;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PracticeLogView = {
  id: string;
  practicedAt: string;
  durationMin: number;
  location: string | null;
  content: string | null;
  isPublic: boolean;
  equipmentId: string | null;
  equipment: EquipmentView | null;
  practiceMenuId: string | null;
  practiceMenu: PracticeMenuSummaryView | null;
};

export type PracticeMenuCategory =
  | "SERVE"
  | "RECEIVE"
  | "FOREHAND"
  | "BACKHAND"
  | "FOOTWORK"
  | "DRIVE"
  | "BLOCK"
  | "GAME"
  | "PHYSICAL"
  | "MENTAL"
  | "OTHER";

export type PracticeMenuSummaryView = {
  id: string;
  title: string;
};

export type PracticeMenuItemView = {
  id: string;
  title: string;
  description: string | null;
  category: PracticeMenuCategory;
  durationMin: number | null;
  order: number;
};

export type PracticeMenuView = PracticeMenuSummaryView & {
  description: string | null;
  goal: string | null;
  totalMinutes: number | null;
  isTemplate: boolean;
  items: PracticeMenuItemView[];
  createdAt: string;
  updatedAt: string;
};

export type ScoreRow = {
  set: number;
  me: number;
  opp: number;
};

export type MatchRecordView = {
  id: string;
  playedAt: string;
  equipmentId: string | null;
  equipment: EquipmentView | null;
  opponentName: string;
  opponentTeam: string | null;
  matchType: "PRACTICE" | "OFFICIAL" | "TOURNAMENT";
  scores: ScoreRow[];
  result: "WIN" | "LOSE" | "DRAW";
  memo: string | null;
  isPublic: boolean;
};

export type ProfileView = {
  name: string;
  email: string;
  username: string | null;
  club: string | null;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "COMPETITIVE" | "PRO";
  gender: "MALE" | "FEMALE" | "OTHER" | "NO_ANSWER" | null;
  playStyle: string | null;
  avatarUrl: string | null;
  publicProfileEnabled: boolean;
};

export type ApiResponse<T> = {
  data?: T;
  error?: string;
};
