import { prisma } from "@table-tennis/db";
import type { FeedbackPlatform } from "@table-tennis/db";
import { feedbackSchema } from "@/lib/validators";

const feedbackHourlyLimit = 10;
const sensitiveSourcePattern =
  /(token|accessToken|authorization|password|passwordHash|api[_-]?key|apikey|secret|bearer|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i;

export class FeedbackError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export async function createFeedback(userId: string, platform: FeedbackPlatform, input: unknown) {
  const body = feedbackSchema.parse(input);
  await assertFeedbackRateLimit(userId);

  return prisma.feedback.create({
    data: {
      userId,
      category: body.category,
      subject: body.subject,
      body: body.body,
      platform,
      sourcePath: sanitizeSourcePath(body.sourcePath)
    },
    select: publicFeedbackSelect
  });
}

export async function getMyFeedbacks(userId: string) {
  return prisma.feedback.findMany({
    where: { userId },
    select: publicFeedbackSelect,
    orderBy: { createdAt: "desc" },
    take: 100
  });
}

export function serializePublicFeedback(feedback: PublicFeedbackRecord) {
  return {
    ...feedback,
    createdAt: feedback.createdAt.toISOString(),
    updatedAt: feedback.updatedAt.toISOString()
  };
}

export function sanitizeSourcePath(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed || sensitiveSourcePattern.test(trimmed)) {
    return null;
  }

  const withoutQuery = trimmed.split(/[?#]/)[0]?.trim() ?? "";

  if (!withoutQuery || sensitiveSourcePattern.test(withoutQuery)) {
    return null;
  }

  if (withoutQuery.startsWith("mobile:/")) {
    return withoutQuery.slice(0, 300);
  }

  try {
    const parsed = new URL(withoutQuery, "https://table-tennis-log.local");
    return parsed.pathname.slice(0, 300);
  } catch {
    return withoutQuery.startsWith("/") ? withoutQuery.slice(0, 300) : null;
  }
}

const publicFeedbackSelect = {
  id: true,
  category: true,
  subject: true,
  platform: true,
  sourcePath: true,
  status: true,
  createdAt: true,
  updatedAt: true
} as const;

export type PublicFeedbackRecord = {
  id: string;
  category: string;
  subject: string;
  platform: string;
  sourcePath: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

async function assertFeedbackRateLimit(userId: string) {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.feedback.count({
    where: {
      userId,
      createdAt: { gte: since }
    }
  });

  if (recentCount >= feedbackHourlyLimit) {
    throw new FeedbackError("フィードバックの送信回数が多すぎます。時間をおいて再度お試しください。", 429);
  }
}
