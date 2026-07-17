import { beforeEach, describe, expect, test, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    update: vi.fn()
  },
  passwordResetToken: {
    updateMany: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn()
  },
  $transaction: vi.fn()
}));

vi.mock("@table-tennis/db", () => ({
  prisma: mockPrisma
}));

vi.mock("@/lib/api", () => ({
  dataResponse: (data: unknown, init?: ResponseInit) => Response.json({ data }, init),
  errorResponse: (error: string, status = 400) => Response.json({ error }, { status }),
  validationErrorResponse: (error: { issues?: { message?: string }[] }) =>
    Response.json({ error: error.issues?.[0]?.message ?? "入力内容を確認してください" }, { status: 400 })
}));

import { POST as forgotPassword } from "@/app/api/auth/forgot-password/route";
import { POST as resetPasswordRoute } from "@/app/api/auth/reset-password/route";
import {
  PASSWORD_RESET_REQUEST_MESSAGE,
  PasswordResetError,
  clearPasswordResetRateLimitForTest,
  hashPasswordResetToken,
  requestPasswordReset,
  resetPassword
} from "./password-reset";

function jsonRequest(path: string, body: unknown) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

async function responseBody(response: Response) {
  return response.json() as Promise<{ data?: { message: string }; error?: string }>;
}

describe("password reset request", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearPasswordResetRateLimitForTest();
    delete process.env.PASSWORD_RESET_BASE_URL;
    delete process.env.AUTH_URL;
    delete process.env.NEXTAUTH_URL;
    delete process.env.EMAIL_FROM;
    delete process.env.RESEND_API_KEY;
    mockPrisma.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.passwordResetToken.create.mockResolvedValue({ id: "reset-token-1" });
    mockPrisma.$transaction.mockImplementation(async (operation) => {
      if (Array.isArray(operation)) {
        return Promise.all(operation);
      }

      return operation(mockPrisma);
    });
  });

  test("登録済みメールでは平文tokenを保存せず、再設定メールを送信する", async () => {
    const now = new Date("2026-07-14T10:00:00.000Z");
    const sendEmail = vi.fn().mockResolvedValue({ skipped: false });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      passwordHash: "old-hash"
    });

    await requestPasswordReset("USER@example.com", "https://app.example.com", "127.0.0.1", {
      now: () => now,
      randomToken: () => "plain-reset-token",
      sendEmail
    });

    const expectedHash = hashPasswordResetToken("plain-reset-token");
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { email: "user@example.com" }
    }));
    expect(mockPrisma.passwordResetToken.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: "user-1", usedAt: null },
      data: { usedAt: now }
    }));
    expect(mockPrisma.passwordResetToken.create).toHaveBeenCalledWith(expect.objectContaining({
      data: {
        userId: "user-1",
        tokenHash: expectedHash,
        expiresAt: new Date("2026-07-14T10:30:00.000Z")
      }
    }));
    expect(mockPrisma.passwordResetToken.create).not.toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ tokenHash: "plain-reset-token" })
    }));
    expect(sendEmail).toHaveBeenCalledWith({
      to: "user@example.com",
      resetUrl: "https://app.example.com/reset-password?token=plain-reset-token"
    });
  });

  test("未登録メールへの申請でも同じ成功レスポンスを返す", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const response = await forgotPassword(jsonRequest("/api/auth/forgot-password", {
      email: "missing@example.com"
    }));
    const body = await responseBody(response);

    expect(response.status).toBe(200);
    expect(body.data?.message).toBe(PASSWORD_RESET_REQUEST_MESSAGE);
    expect(mockPrisma.passwordResetToken.create).not.toHaveBeenCalled();
  });

  test("一時停止中は登録済みメールへの申請でもメール用tokenを作成しない", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      passwordHash: "old-hash"
    });

    const response = await forgotPassword(jsonRequest("/api/auth/forgot-password", {
      email: "user@example.com"
    }));
    const body = await responseBody(response);

    expect(response.status).toBe(200);
    expect(body.data?.message).toBe(PASSWORD_RESET_REQUEST_MESSAGE);
    expect(mockPrisma.passwordResetToken.create).not.toHaveBeenCalled();
  });
});

describe("password reset completion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (operation) => {
      if (Array.isArray(operation)) {
        return Promise.all(operation);
      }

      return operation(mockPrisma);
    });
    mockPrisma.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.user.update.mockResolvedValue({ id: "user-1" });
  });

  test("正しいtokenで新しいpasswordHashへ更新し、tokenを使用済みにする", async () => {
    const now = new Date("2026-07-14T10:00:00.000Z");
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
      id: "token-1",
      userId: "user-1",
      expiresAt: new Date("2026-07-14T10:30:00.000Z"),
      usedAt: null
    });

    await resetPassword("valid-token", "new-password", {
      now: () => now,
      hashPassword: async () => "new-password-hash"
    });

    expect(mockPrisma.passwordResetToken.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { tokenHash: hashPasswordResetToken("valid-token") }
    }));
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { passwordHash: "new-password-hash" }
    });
    expect(mockPrisma.passwordResetToken.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "token-1", usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now }
    }));
  });

  test("期限切れtokenを拒否する", async () => {
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
      id: "token-1",
      userId: "user-1",
      expiresAt: new Date("2026-07-14T09:59:59.000Z"),
      usedAt: null
    });

    await expect(resetPassword("expired-token", "new-password", {
      now: () => new Date("2026-07-14T10:00:00.000Z")
    })).rejects.toMatchObject(new PasswordResetError("expired"));
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  test("使用済みtokenを拒否する", async () => {
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
      id: "token-1",
      userId: "user-1",
      expiresAt: new Date("2026-07-14T10:30:00.000Z"),
      usedAt: new Date("2026-07-14T10:01:00.000Z")
    });

    await expect(resetPassword("used-token", "new-password")).rejects.toMatchObject(new PasswordResetError("used"));
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  test("不正なtokenを拒否する", async () => {
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);

    await expect(resetPassword("invalid-token", "new-password")).rejects.toMatchObject(new PasswordResetError("invalid"));
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  test("パスワード確認不一致を拒否する", async () => {
    const response = await resetPasswordRoute(jsonRequest("/api/auth/reset-password", {
      token: "valid-token",
      password: "new-password",
      confirmPassword: "different-password"
    }));
    const body = await responseBody(response);

    expect(response.status).toBe(400);
    expect(body.error).toBe("パスワード確認が一致しません");
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  test("条件を満たさないパスワードを拒否する", async () => {
    const response = await resetPasswordRoute(jsonRequest("/api/auth/reset-password", {
      token: "valid-token",
      password: "short",
      confirmPassword: "short"
    }));
    const body = await responseBody(response);

    expect(response.status).toBe(400);
    expect(body.error).toBe("パスワードが条件を満たしていません");
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });
});
