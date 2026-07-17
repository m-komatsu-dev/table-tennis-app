import { beforeEach, describe, expect, test, vi } from "vitest";

const mockTx = vi.hoisted(() => ({
  partnerPost: {
    findMany: vi.fn(),
    deleteMany: vi.fn()
  },
  partnerRequest: {
    findMany: vi.fn(),
    deleteMany: vi.fn()
  },
  chatRoom: {
    findMany: vi.fn(),
    deleteMany: vi.fn()
  },
  chatMessage: {
    findMany: vi.fn(),
    deleteMany: vi.fn()
  },
  notification: {
    deleteMany: vi.fn()
  },
  report: {
    deleteMany: vi.fn()
  },
  feedback: {
    deleteMany: vi.fn()
  },
  userBlock: {
    deleteMany: vi.fn()
  },
  chatReadState: {
    deleteMany: vi.fn()
  },
  passwordResetToken: {
    deleteMany: vi.fn()
  },
  practiceLog: {
    deleteMany: vi.fn()
  },
  matchRecord: {
    deleteMany: vi.fn()
  },
  practiceMenu: {
    deleteMany: vi.fn()
  },
  equipment: {
    deleteMany: vi.fn()
  },
  user: {
    delete: vi.fn()
  }
}));

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn()
  },
  $transaction: vi.fn()
}));

const mockBcrypt = vi.hoisted(() => ({
  compare: vi.fn()
}));

vi.mock("@table-tennis/db", () => ({
  prisma: mockPrisma
}));

vi.mock("bcryptjs", () => ({
  default: mockBcrypt
}));

import {
  ACCOUNT_DELETION_CONFIRMATION_TEXT,
  AccountDeletionError,
  deleteUserAccount,
  resetAccountDeletionRateLimit
} from "./account-deletion";

const validInput = {
  currentPassword: "current-password",
  confirmationText: ACCOUNT_DELETION_CONFIRMATION_TEXT,
  confirmedIrreversible: true
};

describe("account deletion lite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAccountDeletionRateLimit();
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      passwordHash: "hashed-password",
      googleId: null,
      avatarUrl: "data:image/png;base64,aGVsbG8="
    });
    mockBcrypt.compare.mockResolvedValue(true);
    mockPrisma.$transaction.mockImplementation(async (callback) => callback(mockTx));
    mockTx.partnerPost.findMany.mockResolvedValue([{ id: "owned-post-1" }]);
    mockTx.partnerRequest.findMany.mockResolvedValue([{ id: "request-1" }, { id: "request-2" }]);
    mockTx.chatRoom.findMany.mockResolvedValue([{ id: "room-1" }]);
    mockTx.chatMessage.findMany.mockResolvedValue([{ id: "message-1" }, { id: "message-2" }]);
    mockTx.partnerPost.deleteMany.mockResolvedValue({ count: 1 });
    mockTx.partnerRequest.deleteMany.mockResolvedValue({ count: 1 });
    mockTx.chatRoom.deleteMany.mockResolvedValue({ count: 1 });
    mockTx.chatMessage.deleteMany.mockResolvedValue({ count: 1 });
    mockTx.notification.deleteMany.mockResolvedValue({ count: 1 });
    mockTx.report.deleteMany.mockResolvedValue({ count: 1 });
    mockTx.feedback.deleteMany.mockResolvedValue({ count: 1 });
    mockTx.userBlock.deleteMany.mockResolvedValue({ count: 1 });
    mockTx.chatReadState.deleteMany.mockResolvedValue({ count: 1 });
    mockTx.passwordResetToken.deleteMany.mockResolvedValue({ count: 1 });
    mockTx.practiceLog.deleteMany.mockResolvedValue({ count: 1 });
    mockTx.matchRecord.deleteMany.mockResolvedValue({ count: 1 });
    mockTx.practiceMenu.deleteMany.mockResolvedValue({ count: 1 });
    mockTx.equipment.deleteMany.mockResolvedValue({ count: 1 });
    mockTx.user.delete.mockResolvedValue({ id: "user-1" });
  });

  test("現在のパスワードが間違っている場合は削除しない", async () => {
    mockBcrypt.compare.mockResolvedValue(false);

    await expect(deleteUserAccount({ userId: "user-1", input: validInput })).rejects.toMatchObject(
      new AccountDeletionError("incorrect_current_password")
    );

    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    expect(mockTx.user.delete).not.toHaveBeenCalled();
  });

  test("確認文言が違う場合は削除しない", async () => {
    await expect(deleteUserAccount({
      userId: "user-1",
      input: {
        ...validInput,
        confirmationText: "削除"
      }
    })).rejects.toMatchObject(new AccountDeletionError("invalid_confirmation"));

    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  test("最終確認がfalseの場合は削除しない", async () => {
    await expect(deleteUserAccount({
      userId: "user-1",
      input: {
        ...validInput,
        confirmedIrreversible: false
      }
    })).rejects.toMatchObject(new AccountDeletionError("missing_irreversible_confirmation"));

    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  test("正しい本人確認で関連データとUserを削除する", async () => {
    await deleteUserAccount({ userId: "user-1", input: validInput });

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "user-1" }
    }));
    expect(mockTx.notification.deleteMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        OR: expect.arrayContaining([
          { userId: "user-1" },
          { chatRoomId: { in: ["room-1"] } },
          { chatMessageId: { in: ["message-1", "message-2"] } },
          { partnerPostId: { in: ["owned-post-1"] } }
        ])
      })
    }));
    expect(mockTx.report.deleteMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        OR: expect.arrayContaining([
          { reporterId: "user-1" },
          { targetUserId: "user-1" },
          { targetPostId: { in: ["owned-post-1"] } },
          { targetRequestId: { in: ["request-1", "request-2"] } },
          { targetMessageId: { in: ["message-1", "message-2"] } }
        ])
      })
    }));
    expect(mockTx.feedback.deleteMany).toHaveBeenCalledWith({ where: { userId: "user-1" } });
    expect(mockTx.userBlock.deleteMany).toHaveBeenCalledWith({
      where: { OR: [{ blockerId: "user-1" }, { blockedId: "user-1" }] }
    });
    expect(mockTx.practiceLog.deleteMany).toHaveBeenCalledWith({ where: { userId: "user-1" } });
    expect(mockTx.matchRecord.deleteMany).toHaveBeenCalledWith({ where: { userId: "user-1" } });
    expect(mockTx.practiceMenu.deleteMany).toHaveBeenCalledWith({ where: { userId: "user-1" } });
    expect(mockTx.equipment.deleteMany).toHaveBeenCalledWith({ where: { userId: "user-1" } });
    expect(mockTx.user.delete).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { id: true }
    });
  });

  test("Googleユーザーは再認証なしでは削除できない", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "google-user",
      passwordHash: null,
      googleId: "google-sub",
      avatarUrl: "https://example.com/avatar.png"
    });

    await expect(deleteUserAccount({
      userId: "google-user",
      input: {
        confirmationText: ACCOUNT_DELETION_CONFIRMATION_TEXT,
        confirmedIrreversible: true
      }
    })).rejects.toMatchObject(new AccountDeletionError("reauth_required"));

    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  test("Googleユーザーは10分以内の再認証で削除できる", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "google-user",
      passwordHash: null,
      googleId: "google-sub",
      avatarUrl: "https://example.com/avatar.png"
    });

    await deleteUserAccount({
      userId: "google-user",
      input: {
        confirmationText: ACCOUNT_DELETION_CONFIRMATION_TEXT,
        confirmedIrreversible: true
      },
      mobileTokenIssuedAt: Math.floor(Date.now() / 1000)
    });

    expect(mockTx.user.delete).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "google-user" }
    }));
  });

  test("削除試行は1時間に5回までに制限する", async () => {
    mockBcrypt.compare.mockResolvedValue(false);

    for (let index = 0; index < 5; index += 1) {
      await expect(deleteUserAccount({ userId: "user-1", input: validInput })).rejects.toMatchObject(
        new AccountDeletionError("incorrect_current_password")
      );
    }

    await expect(deleteUserAccount({ userId: "user-1", input: validInput })).rejects.toMatchObject(
      new AccountDeletionError("rate_limited")
    );
  });
});
