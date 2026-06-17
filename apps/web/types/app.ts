export type EquipmentView = {
  id: string;
  blade: string;
  rubberFh: string | null;
  rubberBh: string | null;
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
  equipmentId: string | null;
  equipment: EquipmentView | null;
};

export type ScoreRow = {
  set: number;
  me: number;
  opp: number;
};

export type MatchRecordView = {
  id: string;
  playedAt: string;
  opponentName: string;
  matchType: "PRACTICE" | "OFFICIAL" | "TOURNAMENT";
  scores: ScoreRow[];
  result: "WIN" | "LOSE" | "DRAW";
  memo: string | null;
};

export type ProfileView = {
  name: string;
  email: string;
  club: string | null;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "COMPETITIVE";
  playStyle: string | null;
  avatarUrl: string | null;
};

export type ApiResponse<T> = {
  data?: T;
  error?: string;
};
