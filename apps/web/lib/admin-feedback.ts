import { Prisma, prisma } from "@table-tennis/db";
import type { FeedbackCategory, FeedbackPlatform, FeedbackStatus } from "@table-tennis/db";
import { adminFeedbackUpdateSchema } from "@/lib/validators";

export type FeedbackFilters = {
  status?: FeedbackStatus;
  category?: FeedbackCategory;
  platform?: FeedbackPlatform;
};

const feedbackUserSelect = {
  name: true,
  username: true,
  publicProfileEnabled: true
} satisfies Prisma.UserSelect;

export const adminFeedbackSelect = {
  id: true,
  userId: true,
  category: true,
  subject: true,
  body: true,
  platform: true,
  sourcePath: true,
  status: true,
  adminNote: true,
  createdAt: true,
  updatedAt: true,
  user: { select: feedbackUserSelect }
} satisfies Prisma.FeedbackSelect;

export type AdminFeedbackRecord = Prisma.FeedbackGetPayload<{ select: typeof adminFeedbackSelect }>;

export function buildFeedbackWhere(filters: FeedbackFilters) {
  return {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.platform ? { platform: filters.platform } : {})
  } satisfies Prisma.FeedbackWhereInput;
}

export async function getAdminFeedbackList(filters: FeedbackFilters) {
  const where = buildFeedbackWhere(filters);
  const [totalCount, feedbacks] = await Promise.all([
    prisma.feedback.count(),
    prisma.feedback.findMany({
      where,
      select: adminFeedbackSelect,
      orderBy: { createdAt: "desc" },
      take: 100
    })
  ]);

  return { totalCount, feedbacks };
}

export async function getAdminFeedbackDetail(id: string) {
  return prisma.feedback.findUnique({
    where: { id },
    select: adminFeedbackSelect
  });
}

export async function updateAdminFeedback(id: string, input: unknown) {
  const body = adminFeedbackUpdateSchema.parse(input);
  const result = await prisma.feedback.updateMany({
    where: { id },
    data: {
      status: body.status,
      adminNote: body.adminNote?.trim() ? body.adminNote.trim() : null
    }
  });

  return result.count > 0;
}

export function serializeAdminFeedback(feedback: AdminFeedbackRecord) {
  return {
    ...feedback,
    createdAt: feedback.createdAt.toISOString(),
    updatedAt: feedback.updatedAt.toISOString()
  };
}
