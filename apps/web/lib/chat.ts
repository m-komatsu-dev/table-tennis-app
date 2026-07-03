import { prisma } from "@table-tennis/db";
import type { ChatMessage, ChatRoom, PartnerPost, PartnerRequest, Prisma, User } from "@table-tennis/db";
import { getBlockState } from "@/lib/safety";
import { chatMessageSchema } from "@/lib/validators";

export class ChatError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const chatUserSelect = {
  name: true,
  username: true,
  publicProfileEnabled: true
} satisfies Prisma.UserSelect;

export const chatRoomListInclude = {
  partnerRequest: {
    include: {
      post: { select: { id: true, title: true, ownerId: true, owner: { select: chatUserSelect } } },
      requester: { select: chatUserSelect }
    }
  },
  messages: {
    orderBy: { createdAt: "desc" },
    take: 1,
    include: { sender: { select: chatUserSelect } }
  }
} satisfies Prisma.ChatRoomInclude;

export const chatRoomDetailInclude = {
  partnerRequest: {
    include: {
      post: { select: { id: true, title: true, ownerId: true, owner: { select: chatUserSelect } } },
      requester: { select: chatUserSelect }
    }
  },
  messages: {
    orderBy: { createdAt: "asc" },
    include: { sender: { select: chatUserSelect } }
  }
} satisfies Prisma.ChatRoomInclude;

type ChatUser = Pick<User, "name" | "username" | "publicProfileEnabled">;

type ChatPost = Pick<PartnerPost, "id" | "title" | "ownerId"> & {
  owner: ChatUser;
};

type ChatRequest = Pick<PartnerRequest, "id" | "postId" | "requesterId" | "status"> & {
  post: ChatPost;
  requester: ChatUser;
};

type ChatMessageWithSender = ChatMessage & {
  sender: ChatUser;
};

type ChatRoomWithRequest = ChatRoom & {
  partnerRequest: ChatRequest;
  messages: ChatMessageWithSender[];
};

export async function ensureChatRoomForPartnerRequest(partnerRequestId: string) {
  const request = await prisma.partnerRequest.findUnique({
    where: { id: partnerRequestId },
    select: { id: true, status: true }
  });

  if (!request || request.status !== "ACCEPTED") {
    return null;
  }

  return prisma.chatRoom.upsert({
    where: { partnerRequestId },
    update: {},
    create: { partnerRequestId },
    select: { id: true }
  });
}

export async function getChatRoomsForUser(userId: string) {
  const rooms = await prisma.chatRoom.findMany({
    where: {
      partnerRequest: {
        status: "ACCEPTED",
        OR: [{ requesterId: userId }, { post: { ownerId: userId } }]
      }
    },
    include: chatRoomListInclude,
    orderBy: { updatedAt: "desc" }
  });

  return rooms.map((room) => serializeChatRoom(room, userId));
}

export async function getChatRoomForUser(roomId: string, userId: string) {
  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
    include: chatRoomDetailInclude
  });

  if (!room) {
    throw new ChatError("チャットを読み込めませんでした。", 404);
  }

  assertAcceptedParticipant(room.partnerRequest, userId);

  const otherUserId = getOtherUserId(room.partnerRequest, userId);
  const blockState = await getBlockState(userId, otherUserId);

  return {
    ...serializeChatRoom(room, userId),
    messages: room.messages.map((message) => serializeChatMessage(message, userId)),
    isInteractionBlocked: blockState.isBlocked,
    blockedByMe: blockState.blockedByMe,
    blocksMe: blockState.blocksMe
  };
}

export async function createChatMessage(roomId: string, userId: string, input: unknown) {
  const body = chatMessageSchema.parse(input);
  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
    select: {
      id: true,
      partnerRequest: {
        select: {
          id: true,
          requesterId: true,
          status: true,
          post: { select: { ownerId: true } }
        }
      }
    }
  });

  if (!room) {
    throw new ChatError("チャットを読み込めませんでした。", 404);
  }

  assertAcceptedParticipant(room.partnerRequest, userId);

  const otherUserId = getOtherUserId(room.partnerRequest, userId);
  const blockState = await getBlockState(userId, otherUserId);

  if (blockState.isBlocked) {
    throw new ChatError("このユーザーとは現在やり取りできません。", 403);
  }

  const [message] = await prisma.$transaction([
    prisma.chatMessage.create({
      data: {
        roomId,
        senderId: userId,
        body: body.body
      },
      include: { sender: { select: chatUserSelect } }
    }),
    prisma.chatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() },
      select: { id: true }
    })
  ]);

  return serializeChatMessage(message, userId);
}

export function serializeChatRoom(room: ChatRoomWithRequest, currentUserId: string) {
  const otherUser = getOtherUser(room.partnerRequest, currentUserId);
  const latestMessage = room.messages[0] ?? null;

  return {
    id: room.id,
    partnerRequestId: room.partnerRequestId,
    partnerPostId: room.partnerRequest.post.id,
    partnerPostTitle: room.partnerRequest.post.title,
    otherUserId: getOtherUserId(room.partnerRequest, currentUserId),
    otherUser: serializeChatUser(otherUser),
    latestMessage: latestMessage ? serializeChatMessage(latestMessage, currentUserId) : null,
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString()
  };
}

export function serializeChatMessage(message: ChatMessageWithSender, currentUserId: string) {
  return {
    id: message.id,
    roomId: message.roomId,
    senderId: message.senderId,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    isMine: message.senderId === currentUserId,
    sender: serializeChatUser(message.sender)
  };
}

function assertAcceptedParticipant(request: Pick<PartnerRequest, "requesterId" | "status"> & { post: Pick<PartnerPost, "ownerId"> }, userId: string) {
  if (request.status !== "ACCEPTED") {
    throw new ChatError("このチャットを表示する権限がありません。", 403);
  }

  if (request.requesterId !== userId && request.post.ownerId !== userId) {
    throw new ChatError("このチャットを表示する権限がありません。", 403);
  }
}

function getOtherUserId(request: Pick<PartnerRequest, "requesterId"> & { post: Pick<PartnerPost, "ownerId"> }, currentUserId: string) {
  return request.post.ownerId === currentUserId ? request.requesterId : request.post.ownerId;
}

function getOtherUser(request: ChatRequest, currentUserId: string) {
  return request.post.ownerId === currentUserId ? request.requester : request.post.owner;
}

function serializeChatUser(user: ChatUser) {
  return {
    name: user.name,
    username: user.publicProfileEnabled ? user.username : null,
    publicProfileEnabled: user.publicProfileEnabled
  };
}
