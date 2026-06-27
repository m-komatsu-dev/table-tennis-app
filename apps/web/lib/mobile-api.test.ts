import { beforeEach, describe, expect, test, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn()
  },
  practiceLog: {
    findMany: vi.fn()
  },
  matchRecord: {
    findMany: vi.fn()
  }
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

import { POST as login } from "@/app/api/mobile/auth/login/route";
import { GET as getPractice } from "@/app/api/mobile/practice/route";
import { GET as getMatch } from "@/app/api/mobile/match/route";
import { createMobileAccessToken } from "./mobile-auth";

function jsonRequest(path: string, body: unknown, token?: string) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
}

function authRequest(path: string, userId: string) {
  return new Request(`http://localhost${path}`, {
    headers: { Authorization: `Bearer ${createMobileAccessToken(userId)}` }
  });
}

describe("mobile login API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MOBILE_AUTH_SECRET = "test-mobile-secret-that-is-long-enough-12345";
  });

  test("正しいemail/passwordで成功する", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      name: "卓球 太郎",
      email: "user@example.com",
      passwordHash: "hashed-password"
    });
    mockBcrypt.compare.mockResolvedValue(true);

    const response = await login(jsonRequest("/api/mobile/auth/login", {
      email: "USER@example.com",
      password: "password123"
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.accessToken).toEqual(expect.any(String));
    expect(body.user).toEqual({
      id: "user-1",
      name: "卓球 太郎",
      email: "user@example.com"
    });
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { email: "user@example.com" }
    }));
  });

  test("password間違いで401を返す", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      name: "卓球 太郎",
      email: "user@example.com",
      passwordHash: "hashed-password"
    });
    mockBcrypt.compare.mockResolvedValue(false);

    const response = await login(jsonRequest("/api/mobile/auth/login", {
      email: "user@example.com",
      password: "wrong-password"
    }));

    expect(response.status).toBe(401);
  });

  test("存在しないemailで401を返す", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const response = await login(jsonRequest("/api/mobile/auth/login", {
      email: "missing@example.com",
      password: "password123"
    }));

    expect(response.status).toBe(401);
    expect(mockBcrypt.compare).not.toHaveBeenCalled();
  });
});

describe("mobile practice API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MOBILE_AUTH_SECRET = "test-mobile-secret-that-is-long-enough-12345";
  });

  test("ログインユーザーのデータのみ返す", async () => {
    mockPrisma.practiceLog.findMany.mockResolvedValue([
      {
        id: "practice-1",
        userId: "user-1",
        practicedAt: new Date("2026-06-20T00:00:00.000Z"),
        durationMin: 90,
        location: "体育館",
        content: "サーブ練習",
        equipmentId: null,
        equipment: null,
        practiceMenuId: null,
        practiceMenu: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    const response = await getPractice(authRequest("/api/mobile/practice", "user-1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockPrisma.practiceLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: "user-1" }
    }));
    expect(body.practiceLogs).toHaveLength(1);
  });
});

describe("mobile match API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MOBILE_AUTH_SECRET = "test-mobile-secret-that-is-long-enough-12345";
  });

  test("ログインユーザーのデータのみ返す", async () => {
    mockPrisma.matchRecord.findMany.mockResolvedValue([
      {
        id: "match-1",
        userId: "user-1",
        equipmentId: null,
        equipment: null,
        opponentName: "佐藤",
        opponentTeam: "A高校",
        matchType: "PRACTICE",
        scores: [{ set: 1, me: 11, opp: 7 }],
        result: "WIN",
        memo: "よい出足",
        playedAt: new Date("2026-06-21T00:00:00.000Z"),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    const response = await getMatch(authRequest("/api/mobile/match", "user-1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockPrisma.matchRecord.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: "user-1" }
    }));
    expect(body.matchRecords).toHaveLength(1);
  });
});
