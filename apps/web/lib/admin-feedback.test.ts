import { beforeEach, describe, expect, test, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  feedback: {
    count: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn()
  }
}));

vi.mock("@table-tennis/db", () => ({
  prisma: mockPrisma,
  Prisma: {}
}));

import { getAdminFeedbackList, updateAdminFeedback } from "@/lib/admin-feedback";

describe("admin feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("admin list can filter status, category and platform", async () => {
    mockPrisma.feedback.count.mockResolvedValue(2);
    mockPrisma.feedback.findMany.mockResolvedValue([]);

    await getAdminFeedbackList({
      status: "OPEN",
      category: "BUG",
      platform: "WEB"
    });

    expect(mockPrisma.feedback.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        status: "OPEN",
        category: "BUG",
        platform: "WEB"
      },
      orderBy: { createdAt: "desc" }
    }));
  });

  test("admin can update status and adminNote", async () => {
    mockPrisma.feedback.updateMany.mockResolvedValue({ count: 1 });

    const result = await updateAdminFeedback("feedback-1", {
      status: "REVIEWING",
      adminNote: " 内容を確認中です。 "
    });

    expect(result).toBe(true);
    expect(mockPrisma.feedback.updateMany).toHaveBeenCalledWith({
      where: { id: "feedback-1" },
      data: {
        status: "REVIEWING",
        adminNote: "内容を確認中です。"
      }
    });
  });

  test("adminNote is limited to 2000 characters", async () => {
    await expect(updateAdminFeedback("feedback-1", {
      status: "OPEN",
      adminNote: "a".repeat(2001)
    })).rejects.toThrow("管理者メモは2000文字以内で入力してください。");
  });
});
