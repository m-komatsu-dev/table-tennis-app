import { beforeEach, describe, expect, test, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  feedback: {
    count: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn()
  }
}));

vi.mock("@table-tennis/db", () => ({
  prisma: mockPrisma
}));

import { createFeedback, getMyFeedbacks, sanitizeSourcePath, serializePublicFeedback } from "@/lib/feedback";

describe("feedback lite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.feedback.count.mockResolvedValue(0);
    mockPrisma.feedback.create.mockResolvedValue({
      id: "feedback-1",
      category: "BUG",
      subject: "保存エラー",
      platform: "WEB",
      sourcePath: "/dashboard",
      status: "OPEN",
      createdAt: new Date("2026-07-17T00:00:00.000Z"),
      updatedAt: new Date("2026-07-17T00:00:00.000Z")
    });
  });

  test("creates feedback using authenticated userId instead of body userId", async () => {
    await createFeedback("session-user", "WEB", {
      userId: "attacker-user",
      category: "BUG",
      subject: "保存エラー",
      body: "練習記録を保存するとエラーになります。",
      sourcePath: "/dashboard?token=secret"
    });

    expect(mockPrisma.feedback.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: "session-user",
        sourcePath: null
      })
    }));
    expect(mockPrisma.feedback.create).not.toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: "attacker-user" })
    }));
  });

  test("rejects invalid category and short body", async () => {
    await expect(createFeedback("user-1", "WEB", {
      category: "REPORT",
      subject: "件名",
      body: "短い"
    })).rejects.toThrow();

    expect(mockPrisma.feedback.create).not.toHaveBeenCalled();
  });

  test("rejects long body", async () => {
    await expect(createFeedback("user-1", "WEB", {
      category: "OTHER",
      subject: "件名",
      body: "あ".repeat(3001)
    })).rejects.toThrow("内容は3000文字以内で入力してください。");
  });

  test("enforces per-user hourly limit", async () => {
    mockPrisma.feedback.count.mockResolvedValue(10);

    await expect(createFeedback("user-1", "WEB", {
      category: "OTHER",
      subject: "件名",
      body: "送信回数が多いケースです。"
    })).rejects.toMatchObject({ status: 429 });
  });

  test("sanitizes sourcePath", () => {
    expect(sanitizeSourcePath("/chat/abc?foo=bar")).toBe("/chat/abc");
    expect(sanitizeSourcePath("mobile:/profile?x=1")).toBe("mobile:/profile");
    expect(sanitizeSourcePath("/reset?accessToken=secret")).toBeNull();
    expect(sanitizeSourcePath("/profile/user@example.com")).toBeNull();
    expect(sanitizeSourcePath("https://example.com/practice?ok=1")).toBe("/practice");
  });

  test("mine history does not select adminNote or user", async () => {
    mockPrisma.feedback.findMany.mockResolvedValue([]);

    await getMyFeedbacks("user-1");

    expect(mockPrisma.feedback.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: "user-1" },
      select: expect.not.objectContaining({
        adminNote: true,
        user: expect.anything()
      })
    }));
  });

  test("public serialization omits adminNote", () => {
    const serialized = serializePublicFeedback({
      id: "feedback-1",
      category: "BUG",
      subject: "保存エラー",
      platform: "WEB",
      sourcePath: "/dashboard",
      status: "OPEN",
      createdAt: new Date("2026-07-17T00:00:00.000Z"),
      updatedAt: new Date("2026-07-17T00:00:00.000Z")
    });

    expect(serialized).not.toHaveProperty("adminNote");
    expect(serialized).not.toHaveProperty("user");
  });
});
