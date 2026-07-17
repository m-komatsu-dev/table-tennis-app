import { beforeEach, describe, expect, test, vi } from "vitest";

const mockTx = vi.hoisted(() => ({
  chatMessage: {
    create: vi.fn()
  },
  chatRoom: {
    update: vi.fn()
  },
  chatReadState: {
    upsert: vi.fn()
  },
  notification: {
    upsert: vi.fn(),
    updateMany: vi.fn()
  }
}));

const mockPrisma = vi.hoisted(() => ({
  chatRoom: {
    findUnique: vi.fn()
  },
  $transaction: vi.fn()
}));

const mockSafety = vi.hoisted(() => ({
  getBlockState: vi.fn()
}));

vi.mock("@table-tennis/db", () => ({
  prisma: mockPrisma
}));

vi.mock("@/lib/safety", () => ({
  getBlockState: mockSafety.getBlockState
}));

import { ChatError, createChatMessage, markChatRoomRead } from "./chat";

const acceptedRoom = {
  id: "room-1",
  partnerRequest: {
    id: "request-1",
    requesterId: "user-b",
    status: "ACCEPTED",
    requester: { name: "Bさん" },
    post: {
      id: "post-1",
      title: "土曜日の練習相手募集",
      ownerId: "user-a",
      owner: { name: "Aさん" }
    }
  }
};

describe("chat message notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (callback) => callback(mockTx));
    mockSafety.getBlockState.mockResolvedValue({ blockedByMe: false, blocksMe: false, isBlocked: false });
    mockTx.chatMessage.create.mockResolvedValue({
      id: "message-1",
      roomId: "room-1",
      senderId: "user-a",
      body: "こんにちは",
      createdAt: new Date("2026-07-17T00:00:00.000Z"),
      sender: { id: "user-a", name: "Aさん", username: "a", publicProfileEnabled: true }
    });
    mockTx.chatRoom.update.mockResolvedValue({ id: "room-1" });
    mockTx.notification.upsert.mockResolvedValue({ id: "notification-1" });
  });

  test("相手への通知を作成し、自分自身には作成しない", async () => {
    mockPrisma.chatRoom.findUnique.mockResolvedValue(acceptedRoom);

    const message = await createChatMessage("room-1", "user-a", { body: "こんにちは" });

    expect(message.id).toBe("message-1");
    expect(mockTx.notification.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        userId_type_chatMessageId: {
          userId: "user-b",
          type: "CHAT_MESSAGE",
          chatMessageId: "message-1"
        }
      },
      create: expect.objectContaining({
        userId: "user-b",
        type: "CHAT_MESSAGE",
        chatRoomId: "room-1",
        chatMessageId: "message-1",
        partnerPostId: "post-1"
      })
    }));
    expect(mockTx.notification.upsert).not.toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ userId: "user-a" })
    }));
  });

  test("同じChatMessageは一意キーでupsertされる", async () => {
    mockPrisma.chatRoom.findUnique.mockResolvedValue(acceptedRoom);

    await createChatMessage("room-1", "user-a", { body: "こんにちは" });

    expect(mockTx.notification.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        userId_type_chatMessageId: {
          userId: "user-b",
          type: "CHAT_MESSAGE",
          chatMessageId: "message-1"
        }
      },
      update: {}
    }));
  });

  test("ブロック中はメッセージと通知を作成しない", async () => {
    mockPrisma.chatRoom.findUnique.mockResolvedValue(acceptedRoom);
    mockSafety.getBlockState.mockResolvedValue({ blockedByMe: true, blocksMe: false, isBlocked: true });

    await expect(createChatMessage("room-1", "user-a", { body: "こんにちは" })).rejects.toBeInstanceOf(ChatError);

    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    expect(mockTx.chatMessage.create).not.toHaveBeenCalled();
    expect(mockTx.notification.upsert).not.toHaveBeenCalled();
  });

  test("チャット詳細を開くと関連チャット通知を既読化する", async () => {
    mockPrisma.chatRoom.findUnique.mockResolvedValue({
      id: "room-1",
      partnerRequest: {
        requesterId: "user-b",
        status: "ACCEPTED",
        post: { ownerId: "user-a" }
      }
    });
    mockTx.chatReadState.upsert.mockResolvedValue({ id: "read-1" });
    mockTx.notification.updateMany.mockResolvedValue({ count: 1 });

    await markChatRoomRead("room-1", "user-b");

    expect(mockTx.chatReadState.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        roomId_userId: {
          roomId: "room-1",
          userId: "user-b"
        }
      }
    }));
    expect(mockTx.notification.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        userId: "user-b",
        type: "CHAT_MESSAGE",
        chatRoomId: "room-1",
        isRead: false
      }
    }));
  });
});
