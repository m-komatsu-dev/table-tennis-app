export type User = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  level?: Level;
  gender?: Gender | null;
  club?: string | null;
  playStyle?: string | null;
  avatarUrl?: string | null;
  publicProfileEnabled: boolean;
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
  isPublic: boolean;
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
  isPublic: boolean;
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

export type PartnerPostType = "PRACTICE" | "MATCH";
export type PartnerPostStatus = "OPEN" | "CLOSED";
export type PartnerRequestStatus = "PENDING" | "ACCEPTED" | "DECLINED";
export type ReportTargetType = "USER" | "PARTNER_POST" | "PARTNER_REQUEST" | "CHAT_MESSAGE";
export type ReportReason = "SPAM" | "HARASSMENT" | "INAPPROPRIATE" | "PERSONAL_INFORMATION" | "FAKE_INFORMATION" | "OTHER";

export type PartnerPublicUser = {
  name: string;
  username: string | null;
  publicProfileEnabled: boolean;
};

export type PartnerPost = {
  id: string;
  ownerId: string;
  type: PartnerPostType;
  title: string;
  area: string | null;
  preferredTime: string | null;
  level: string | null;
  purpose: string | null;
  message: string | null;
  status: PartnerPostStatus;
  createdAt: string;
  updatedAt: string;
  owner: PartnerPublicUser;
  isOwner: boolean;
  isBlockedByMe: boolean;
  blocksMe: boolean;
  isInteractionBlocked: boolean;
  ownRequestStatus: PartnerRequestStatus | null;
  ownChatRoomId: string | null;
  requestCount: number;
};

export type PartnerRequest = {
  id: string;
  postId: string;
  requesterId: string;
  message: string | null;
  status: PartnerRequestStatus;
  chatRoomId: string | null;
  createdAt: string;
  updatedAt: string;
  isRequesterBlocked: boolean;
  requester: PartnerPublicUser;
};

export type UserBlock = {
  blockedUserId: string;
  createdAt: string;
  user: PartnerPublicUser;
};

export type ChatMessage = {
  id: string;
  roomId: string;
  senderId: string;
  body: string;
  createdAt: string;
  isMine: boolean;
  sender: PartnerPublicUser;
};

export type ChatRoom = {
  id: string;
  partnerRequestId: string;
  partnerPostId: string;
  partnerPostTitle: string;
  otherUserId: string;
  otherUser: PartnerPublicUser;
  latestMessage: ChatMessage | null;
  messages?: ChatMessage[];
  isInteractionBlocked?: boolean;
  blockedByMe?: boolean;
  blocksMe?: boolean;
  createdAt: string;
  updatedAt: string;
};
