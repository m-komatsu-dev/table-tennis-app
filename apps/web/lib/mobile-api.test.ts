import { beforeEach, describe, expect, test, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  },
  practiceLog: {
    findMany: vi.fn(),
    create: vi.fn()
  },
  matchRecord: {
    findMany: vi.fn(),
    create: vi.fn()
  }
}));

const mockBcrypt = vi.hoisted(() => ({
  compare: vi.fn(),
  hash: vi.fn()
}));

vi.mock("@table-tennis/db", () => ({
  prisma: mockPrisma
}));

vi.mock("bcryptjs", () => ({
  default: mockBcrypt
}));

import { POST as login } from "@/app/api/mobile/auth/login/route";
import { POST as register } from "@/app/api/mobile/auth/register/route";
import { GET as getProfile, PUT as updateProfile } from "@/app/api/mobile/profile/route";
import { GET as getPractice, POST as createPractice } from "@/app/api/mobile/practice/route";
import { GET as getMatch, POST as createMatch } from "@/app/api/mobile/match/route";
import { createMobileAccessToken } from "./mobile-auth";
import { combineMobilePracticeContent, splitMobilePracticeContent } from "./mobile-api";

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

function putJsonRequest(path: string, body: unknown, token?: string) {
  return new Request(`http://localhost${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
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

describe("mobile register API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MOBILE_AUTH_SECRET = "test-mobile-secret-that-is-long-enough-12345";
  });

  test("正常な入力で201とaccessToken/userを返す", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockBcrypt.hash.mockResolvedValue("hashed-password");
    mockPrisma.user.create.mockResolvedValue({
      id: "user-1",
      name: "中野",
      email: "user@example.com"
    });

    const response = await register(jsonRequest("/api/mobile/auth/register", {
      name: "中野",
      email: "USER@example.com",
      password: "password123",
      confirmPassword: "password123"
    }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.accessToken).toEqual(expect.any(String));
    expect(body.user).toEqual({
      id: "user-1",
      name: "中野",
      email: "user@example.com"
    });
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { email: "user@example.com" }
    }));
  });

  test("email形式不正で400を返す", async () => {
    const response = await register(jsonRequest("/api/mobile/auth/register", {
      name: "中野",
      email: "invalid-email",
      password: "password123",
      confirmPassword: "password123"
    }));

    expect(response.status).toBe(400);
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  test("passwordが短い場合400を返す", async () => {
    const response = await register(jsonRequest("/api/mobile/auth/register", {
      name: "中野",
      email: "user@example.com",
      password: "short",
      confirmPassword: "short"
    }));

    expect(response.status).toBe(400);
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  test("confirmPassword不一致で400を返す", async () => {
    const response = await register(jsonRequest("/api/mobile/auth/register", {
      name: "中野",
      email: "user@example.com",
      password: "password123",
      confirmPassword: "password456"
    }));

    expect(response.status).toBe(400);
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  test("既存emailの場合409を返す", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: "user-1" });

    const response = await register(jsonRequest("/api/mobile/auth/register", {
      name: "中野",
      email: "user@example.com",
      password: "password123",
      confirmPassword: "password123"
    }));

    expect(response.status).toBe(409);
    expect(mockBcrypt.hash).not.toHaveBeenCalled();
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  test("passwordHashを保存しpassword平文は保存しない", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockBcrypt.hash.mockResolvedValue("hashed-password");
    mockPrisma.user.create.mockResolvedValue({
      id: "user-1",
      name: "中野",
      email: "user@example.com"
    });

    await register(jsonRequest("/api/mobile/auth/register", {
      name: "中野",
      email: "user@example.com",
      password: "password123",
      confirmPassword: "password123"
    }));

    expect(mockBcrypt.hash).toHaveBeenCalledWith("password123", 12);
    expect(mockPrisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: {
        email: "user@example.com",
        name: "中野",
        passwordHash: "hashed-password"
      }
    }));
    expect(mockPrisma.user.create.mock.calls[0]?.[0].data).not.toHaveProperty("password");
    expect(mockPrisma.user.create.mock.calls[0]?.[0].data.passwordHash).not.toBe("password123");
  });
});

describe("mobile profile API", () => {
  const token = () => createMobileAccessToken("user-1");
  const validInput = {
    name: "鈴木 太郎",
    level: "BEGINNER",
    gender: "MALE"
  };
  const updatedUser = {
    id: "user-1",
    name: "鈴木 太郎",
    email: "user@example.com",
    level: "BEGINNER",
    gender: "MALE",
    club: null,
    playStyle: null,
    avatarUrl: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MOBILE_AUTH_SECRET = "test-mobile-secret-that-is-long-enough-12345";
  });

  test("tokenなしで401を返す", async () => {
    const response = await updateProfile(putJsonRequest("/api/mobile/profile", validInput));

    expect(response.status).toBe(401);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  test("不正tokenで401を返す", async () => {
    const response = await updateProfile(putJsonRequest("/api/mobile/profile", validInput, "invalid-token"));

    expect(response.status).toBe(401);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  test("正常tokenでプロフィール更新できる", async () => {
    mockPrisma.user.update.mockResolvedValue(updatedUser);

    const response = await updateProfile(putJsonRequest("/api/mobile/profile", validInput, token()));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.user).toEqual(updatedUser);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "user-1" },
      data: {
        name: "鈴木 太郎",
        level: "BEGINNER",
        gender: "MALE"
      }
    }));
  });

  test("nameが空なら400を返す", async () => {
    const response = await updateProfile(putJsonRequest("/api/mobile/profile", {
      ...validInput,
      name: ""
    }, token()));

    expect(response.status).toBe(400);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  test("levelが不正なら400を返す", async () => {
    const response = await updateProfile(putJsonRequest("/api/mobile/profile", {
      ...validInput,
      level: "ELEMENTARY"
    }, token()));

    expect(response.status).toBe(400);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  test("genderが不正なら400を返す", async () => {
    const response = await updateProfile(putJsonRequest("/api/mobile/profile", {
      ...validInput,
      gender: "UNSPECIFIED"
    }, token()));

    expect(response.status).toBe(400);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  test("更新後にGET /api/mobile/profileで反映される", async () => {
    mockPrisma.user.update.mockResolvedValue(updatedUser);
    mockPrisma.user.findUnique.mockResolvedValue(updatedUser);

    const putResponse = await updateProfile(putJsonRequest("/api/mobile/profile", validInput, token()));
    const getResponse = await getProfile(authRequest("/api/mobile/profile", "user-1"));
    const body = await getResponse.json();

    expect(putResponse.status).toBe(200);
    expect(getResponse.status).toBe(200);
    expect(body.user).toEqual(updatedUser);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "user-1" }
    }));
  });

  test("他ユーザーを更新できない", async () => {
    mockPrisma.user.update.mockResolvedValue(updatedUser);

    const response = await updateProfile(putJsonRequest("/api/mobile/profile", {
      ...validInput,
      userId: "user-2"
    }, token()));

    expect(response.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "user-1" }
    }));
    expect(mockPrisma.user.update.mock.calls[0]?.[0].data).not.toHaveProperty("userId");
  });

  test("更新対象なしなら404を返す", async () => {
    mockPrisma.user.update.mockRejectedValueOnce({ code: "P2025" });

    const response = await updateProfile(putJsonRequest("/api/mobile/profile", validInput, token()));

    expect(response.status).toBe(404);
  });

  test("更新時の予期しないエラーは500を返す", async () => {
    mockPrisma.user.update.mockRejectedValueOnce(new Error("database unavailable"));

    const response = await updateProfile(putJsonRequest("/api/mobile/profile", validInput, token()));

    expect(response.status).toBe(500);
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
        content: "サーブ練習\n\nメモ\nYGショート",
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
    expect(body.practiceLogs[0]).toMatchObject({
      content: "サーブ練習",
      memo: "YGショート"
    });
  });

  test("同じユーザーが練習記録を複数作成できる", async () => {
    const basePractice = {
      userId: "user-1",
      practicedAt: new Date("2026-06-20T00:00:00.000Z"),
      durationMin: 90,
      location: "体育館",
      content: "サーブ練習\n\nメモ\nYGショート",
      equipmentId: null,
      equipment: null,
      practiceMenuId: null,
      practiceMenu: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockPrisma.practiceLog.create
      .mockResolvedValueOnce({ ...basePractice, id: "practice-1" })
      .mockResolvedValueOnce({ ...basePractice, id: "practice-2", content: "レシーブ練習" });

    const input = {
      practicedAt: "2026-06-20",
      durationMin: 90,
      location: "体育館",
      content: "サーブ練習",
      memo: "YGショート",
      practiceMenuId: null
    };

    const first = await createPractice(jsonRequest("/api/mobile/practice", input, createMobileAccessToken("user-1")));
    const second = await createPractice(jsonRequest("/api/mobile/practice", {
      ...input,
      content: "レシーブ練習",
      memo: ""
    }, createMobileAccessToken("user-1")));

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(mockPrisma.practiceLog.create).toHaveBeenCalledTimes(2);
    expect(mockPrisma.practiceLog.create.mock.calls[0]?.[0].data).toMatchObject({
      userId: "user-1",
      content: "サーブ練習\n\nメモ\nYGショート"
    });
    expect(mockPrisma.practiceLog.create.mock.calls[1]?.[0].data).toMatchObject({
      userId: "user-1",
      content: "レシーブ練習"
    });
  });
});

describe("mobile practice content parser", () => {
  test("練習内容とメモを分離できる", () => {
    const stored = combineMobilePracticeContent("サーブ", "YGショート");

    expect(stored).toBe("サーブ\n\nメモ\nYGショート");
    expect(splitMobilePracticeContent(stored)).toEqual({
      content: "サーブ",
      memo: "YGショート"
    });
  });

  test("メモだけの保存形式も分離できる", () => {
    expect(splitMobilePracticeContent("メモ\nYGショート")).toEqual({
      content: null,
      memo: "YGショート"
    });
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

  test("同じユーザーが試合記録を複数作成できる", async () => {
    const baseMatch = {
      userId: "user-1",
      equipmentId: null,
      equipment: null,
      opponentTeam: "A高校",
      matchType: "PRACTICE",
      scores: [{ set: 1, me: 11, opp: 7 }],
      result: "WIN",
      memo: "よい出足",
      playedAt: new Date("2026-06-21T00:00:00.000Z"),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockPrisma.matchRecord.create
      .mockResolvedValueOnce({ ...baseMatch, id: "match-1", opponentName: "佐藤" })
      .mockResolvedValueOnce({ ...baseMatch, id: "match-2", opponentName: "鈴木" });

    const input = {
      playedAt: "2026-06-21",
      opponentName: "佐藤",
      opponentTeam: "A高校",
      matchType: "PRACTICE",
      result: "WIN",
      scores: [{ set: 1, me: 11, opp: 7 }],
      memo: "よい出足"
    };

    const first = await createMatch(jsonRequest("/api/mobile/match", input, createMobileAccessToken("user-1")));
    const second = await createMatch(jsonRequest("/api/mobile/match", {
      ...input,
      opponentName: "鈴木"
    }, createMobileAccessToken("user-1")));

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(mockPrisma.matchRecord.create).toHaveBeenCalledTimes(2);
    expect(mockPrisma.matchRecord.create.mock.calls[0]?.[0].data).toMatchObject({
      userId: "user-1",
      opponentName: "佐藤"
    });
    expect(mockPrisma.matchRecord.create.mock.calls[1]?.[0].data).toMatchObject({
      userId: "user-1",
      opponentName: "鈴木"
    });
  });
});
