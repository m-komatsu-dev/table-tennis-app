import type { PartnerPost, PartnerRequest, Prisma, User } from "@table-tennis/db";

export const partnerUserSelect = {
  name: true,
  username: true,
  publicProfileEnabled: true
} as const;

export const partnerPostInclude = {
  owner: { select: partnerUserSelect },
  requests: { select: { requesterId: true, status: true } }
} satisfies Prisma.PartnerPostInclude;

export const partnerRequestInclude = {
  requester: { select: partnerUserSelect }
} satisfies Prisma.PartnerRequestInclude;

export const partnerPostTypeLabels = {
  PRACTICE: "練習相手",
  MATCH: "試合相手"
} as const;

export const partnerPostStatusLabels = {
  OPEN: "募集中",
  CLOSED: "締め切り"
} as const;

export const partnerRequestStatusLabels = {
  PENDING: "未対応",
  ACCEPTED: "承認",
  DECLINED: "見送り"
} as const;

type PublicUser = Pick<User, "name" | "username" | "publicProfileEnabled">;

type PartnerPostWithOwner = PartnerPost & {
  owner: PublicUser;
  requests?: { requesterId: string; status: string }[];
};

type PartnerRequestWithRequester = PartnerRequest & {
  requester: PublicUser;
};

export function serializePartnerUser(user: PublicUser) {
  return {
    name: user.name,
    username: user.publicProfileEnabled ? user.username : null,
    publicProfileEnabled: user.publicProfileEnabled
  };
}

export function serializePartnerPost(
  post: PartnerPostWithOwner,
  currentUserId: string,
  blockState: { blockedByMe?: boolean; blocksMe?: boolean; isBlocked?: boolean } = {}
) {
  const ownRequest = post.requests?.find((request) => request.requesterId === currentUserId) ?? null;

  return {
    id: post.id,
    ownerId: post.ownerId,
    type: post.type,
    title: post.title,
    area: post.area,
    preferredTime: post.preferredTime,
    level: post.level,
    purpose: post.purpose,
    message: post.message,
    status: post.status,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    owner: serializePartnerUser(post.owner),
    isOwner: post.ownerId === currentUserId,
    isBlockedByMe: Boolean(blockState.blockedByMe),
    blocksMe: Boolean(blockState.blocksMe),
    isInteractionBlocked: Boolean(blockState.isBlocked),
    ownRequestStatus: ownRequest?.status ?? null,
    requestCount: post.requests?.length ?? 0
  };
}

export function serializePartnerRequest(
  request: PartnerRequestWithRequester,
  blockState: { isBlocked?: boolean } = {}
) {
  return {
    id: request.id,
    postId: request.postId,
    requesterId: request.requesterId,
    message: request.message,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    isRequesterBlocked: Boolean(blockState.isBlocked),
    requester: serializePartnerUser(request.requester)
  };
}
