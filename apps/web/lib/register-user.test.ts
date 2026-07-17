import { beforeEach, describe, expect, test, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn()
  }
}));

const mockBcrypt = vi.hoisted(() => ({
  hash: vi.fn()
}));

vi.mock("@table-tennis/db", () => ({
  prisma: mockPrisma
}));

vi.mock("bcryptjs", () => ({
  default: mockBcrypt
}));

vi.mock("@/auth", () => ({
  auth: vi.fn()
}));

import { POST as register } from "@/app/api/auth/register/route";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

describe("web register API legal consent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("同意なしでは400を返す", async () => {
    const response = await register(jsonRequest({
      name: "卓球 太郎",
      email: "user@example.com",
      password: "password123"
    }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("利用規約への同意とプライバシーポリシーの確認が必要です。");
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  test("同意ありではサーバー側の文書バージョンを保存する", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockBcrypt.hash.mockResolvedValue("hashed-password");
    mockPrisma.user.create.mockResolvedValue({
      id: "user-1",
      name: "卓球 太郎",
      email: "user@example.com"
    });

    const response = await register(jsonRequest({
      name: "卓球 太郎",
      email: "USER@example.com",
      password: "password123",
      legalConsent: true,
      termsVersion: "9.9",
      privacyPolicyVersion: "9.9"
    }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data).toEqual({
      id: "user-1",
      name: "卓球 太郎",
      email: "user@example.com"
    });
    expect(mockPrisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        email: "user@example.com",
        passwordHash: "hashed-password",
        legalConsentAt: expect.any(Date),
        termsVersion: "1.0",
        privacyPolicyVersion: "1.0"
      })
    }));
    expect(mockPrisma.user.create.mock.calls[0]?.[0].data).not.toHaveProperty("password");
  });
});
