export type User = {
  id: string;
  name: string;
  email: string;
  level?: Level;
  gender?: Gender | null;
  club?: string | null;
  playStyle?: string | null;
  avatarUrl?: string | null;
};

export type Level = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "COMPETITIVE" | "PRO";
export type Gender = "MALE" | "FEMALE" | "OTHER" | "NO_ANSWER";
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

export type PracticeLog = {
  id: string;
  practicedAt: string;
  durationMin: number;
  location: string | null;
  content: string | null;
  memo: string | null;
  practiceMenuId: string | null;
  practiceMenu: { id: string; title: string } | null;
};

export type ScoreRow = {
  set: number;
  me: number;
  opp: number;
};

export type MatchRecord = {
  id: string;
  playedAt: string;
  opponentName: string;
  opponentTeam: string | null;
  matchType: "PRACTICE" | "OFFICIAL" | "TOURNAMENT";
  scores: ScoreRow[];
  result: "WIN" | "LOSE" | "DRAW";
  memo: string | null;
};

export type PracticeMenu = {
  id: string;
  title: string;
  description: string | null;
  goal: string | null;
  totalMinutes: number | null;
  isTemplate?: boolean;
  items: {
    id: string;
    title: string;
    description: string | null;
    category: PracticeMenuCategory;
    durationMin: number | null;
    order: number;
  }[];
  createdAt?: string;
  updatedAt?: string;
};
