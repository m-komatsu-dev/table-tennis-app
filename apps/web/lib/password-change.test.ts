import { beforeEach, describe, expect, test, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    update: vi.fn()
  }
}));

const mockBcrypt = vi.hoisted(() => ({
  compare: vi.fn(),
  hash: vi.fn()
}));

const mockRequireUserId = vi.hoisted(() => vi.fn());

vi.mock("@table-tennis/db", () => ({
  prisma: mockPrisma
}));

vi.mock("bcryptjs", () => ({
  default: mockBcrypt
}));

vi.mock("@/lib/api", () => ({
  dataResponse: (data: unknown, init?: ResponseInit) => Response.json({ data }, init),
  errorResponse: (error: string, status = 400) => Response.json({ error }, { status }),
  requireUserId: mockRequireUserId
}));

import { POST as changePasswordRoute } from "@/app/api/profile/password/route";
import {
  PASSWORD_CHANGE_SUCCESS_MESSAGE,
  PasswordChangeError,
  changePassword
} from "./password-change";

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

describe("password change lite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("現在のパスワードが正しければ新しいpasswordHashへ更新する", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      passwordHash: "old-password-hash"
    });
    mockBcrypt.compare.mockResolvedValue(true);
    mockBcrypt.hash.mockResolvedValue("new-password-hash");
    mockPrisma.user.update.mockResolvedValue({ id: "user-1" });

    await changePassword("user-1", "current-password", "new-password-123");

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: {
        id: true,
        passwordHash: true
      }
    });
    expect(mockBcrypt.compare).toHaveBeenCalledWith("current-password", "old-password-hash");
    expect(mockBcrypt.hash).toHaveBeenCalledWith("new-password-123", 12);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { passwordHash: "new-password-hash" },
      select: { id: true }
    });
  });

  test("現在のパスワードが間違っている場合は更新しない", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      passwordHash: "old-password-hash"
    });
    mockBcrypt.compare.mockResolvedValue(false);

    await expect(changePassword("user-1", "wrong-password", "new-password-123"))
      .rejects.toMatchObject(new PasswordChangeError("incorrect_current"));
    expect(mockBcrypt.hash).not.toHaveBeenCalled();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  test("Googleログインのみのユーザーは利用できない", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-google-1",
      passwordHash: null
    });

    await expect(changePassword("user-google-1", "current-password", "new-password-123"))
      .rejects.toMatchObject(new PasswordChangeError("unavailable"));
    expect(mockBcrypt.compare).not.toHaveBeenCalled();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  test("APIはログイン中ユーザー自身のパスワードだけを変更し、passwordHashを返さない", async () => {
    mockRequireUserId.mockResolvedValue("user-1");
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      passwordHash: "old-password-hash"
    });
    mockBcrypt.compare.mockResolvedValue(true);
    mockBcrypt.hash.mockResolvedValue("new-password-hash");
    mockPrisma.user.update.mockResolvedValue({ id: "user-1" });

    const response = await changePasswordRoute(jsonRequest("/api/profile/password", {
      currentPassword: "current-password",
      newPassword: "new-password-123",
      confirmPassword: "new-password-123",
      userId: "attacker-user-id"
    }));
    const body = await responseBody(response);

    expect(response.status).toBe(200);
    expect(body.data?.message).toBe(PASSWORD_CHANGE_SUCCESS_MESSAGE);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "user-1" }
    }));
    expect(JSON.stringify(body)).not.toMatch(/password|passwordHash/i);
  });

  test("APIは未ログインなら401を返す", async () => {
    mockRequireUserId.mockResolvedValue(null);

    const response = await changePasswordRoute(jsonRequest("/api/profile/password", {
      currentPassword: "current-password",
      newPassword: "new-password-123",
      confirmPassword: "new-password-123"
    }));
    const body = await responseBody(response);

    expect(response.status).toBe(401);
    expect(body.error).toBe("認証が必要です");
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  test("APIはパスワード確認不一致を拒否する", async () => {
    mockRequireUserId.mockResolvedValue("user-1");

    const response = await changePasswordRoute(jsonRequest("/api/profile/password", {
      currentPassword: "current-password",
      newPassword: "new-password-123",
      confirmPassword: "different-password"
    }));
    const body = await responseBody(response);

    expect(response.status).toBe(400);
    expect(body.error).toBe("パスワード確認が一致しません");
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  test("APIは条件を満たさない新しいパスワードを拒否する", async () => {
    mockRequireUserId.mockResolvedValue("user-1");

    const response = await changePasswordRoute(jsonRequest("/api/profile/password", {
      currentPassword: "current-password",
      newPassword: "short",
      confirmPassword: "short"
    }));
    const body = await responseBody(response);

    expect(response.status).toBe(400);
    expect(body.error).toBe("パスワードが条件を満たしていません");
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });
});
