import { Prisma, prisma } from "@table-tennis/db";
import type { ReportStatus, ReportTargetType } from "@table-tennis/db";

export const reportStatusLabels: Record<ReportStatus, string> = {
  OPEN: "未対応",
  REVIEWED: "問題あり",
  DISMISSED: "問題なし・却下"
};

export const reportTargetTypeLabels: Record<ReportTargetType, string> = {
  USER: "ユーザー",
  PARTNER_POST: "募集",
  PARTNER_REQUEST: "参加希望",
  CHAT_MESSAGE: "チャットメッセージ"
};

export type ReportFilters = {
  status?: ReportStatus;
  targetType?: ReportTargetType;
};

const publicUserSelect = {
  name: true,
  username: true,
  publicProfileEnabled: true
} satisfies Prisma.UserSelect;

export const adminReportSelect = {
  id: true,
  reporterId: true,
  targetType: true,
  targetUserId: true,
  targetPostId: true,
  targetRequestId: true,
  targetMessageId: true,
  reason: true,
  details: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  reporter: { select: publicUserSelect }
} satisfies Prisma.ReportSelect;

export type AdminReportRecord = Prisma.ReportGetPayload<{ select: typeof adminReportSelect }>;

export function buildReportWhere(filters: ReportFilters) {
  return {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.targetType ? { targetType: filters.targetType } : {})
  } satisfies Prisma.ReportWhereInput;
}

export async function getAdminReportList(filters: ReportFilters) {
  const where = buildReportWhere(filters);
  const [totalCount, reports] = await Promise.all([
    prisma.report.count(),
    prisma.report.findMany({
      where,
      select: adminReportSelect,
      orderBy: { createdAt: "desc" },
      take: 100
    })
  ]);

  const targetUserIds = compact(reports.map((report) => report.targetUserId));
  const targetPostIds = compact(reports.map((report) => report.targetPostId));
  const targetRequestIds = compact(reports.map((report) => report.targetRequestId));
  const targetMessageIds = compact(reports.map((report) => report.targetMessageId));

  const [targetUsers, targetPosts, targetRequests, targetMessages] = await Promise.all([
    targetUserIds.length > 0
      ? prisma.user.findMany({
          where: { id: { in: unique(targetUserIds) } },
          select: { id: true, ...publicUserSelect }
        })
      : [],
    targetPostIds.length > 0
      ? prisma.partnerPost.findMany({
          where: { id: { in: unique(targetPostIds) } },
          select: { id: true, title: true }
        })
      : [],
    targetRequestIds.length > 0
      ? prisma.partnerRequest.findMany({
          where: { id: { in: unique(targetRequestIds) } },
          select: { id: true, post: { select: { id: true, title: true } } }
        })
      : [],
    targetMessageIds.length > 0
      ? prisma.chatMessage.findMany({
          where: { id: { in: unique(targetMessageIds) } },
          select: {
            id: true,
            body: true,
            room: { select: { partnerRequest: { select: { post: { select: { id: true, title: true } } } } } }
          }
        })
      : []
  ]);

  const userMap = new Map(targetUsers.map((user) => [user.id, user]));
  const postMap = new Map(targetPosts.map((post) => [post.id, post]));
  const requestMap = new Map(targetRequests.map((request) => [request.id, request]));
  const messageMap = new Map(targetMessages.map((message) => [message.id, message]));

  return {
    totalCount,
    reports: reports.map((report) => {
      const request = report.targetRequestId ? requestMap.get(report.targetRequestId) : null;
      const message = report.targetMessageId ? messageMap.get(report.targetMessageId) : null;
      const post = report.targetPostId ? postMap.get(report.targetPostId) : request?.post ?? message?.room.partnerRequest.post ?? null;

      return {
        ...report,
        targetUser: report.targetUserId ? userMap.get(report.targetUserId) ?? null : null,
        targetPost: post,
        targetMessage: message
      };
    })
  };
}

export async function getAdminReportDetail(id: string) {
  const report = await prisma.report.findUnique({
    where: { id },
    select: adminReportSelect
  });

  if (!report) {
    return null;
  }

  const [targetUser, targetPost, targetRequest, targetMessage] = await Promise.all([
    report.targetUserId
      ? prisma.user.findUnique({
          where: { id: report.targetUserId },
          select: { id: true, ...publicUserSelect, createdAt: true }
        })
      : null,
    report.targetPostId
      ? prisma.partnerPost.findUnique({
          where: { id: report.targetPostId },
          select: { id: true, title: true, message: true, createdAt: true, owner: { select: publicUserSelect } }
        })
      : null,
    report.targetRequestId
      ? prisma.partnerRequest.findUnique({
          where: { id: report.targetRequestId },
          select: {
            id: true,
            message: true,
            createdAt: true,
            requester: { select: publicUserSelect },
            post: { select: { id: true, title: true, message: true, createdAt: true } }
          }
        })
      : null,
    report.targetMessageId
      ? prisma.chatMessage.findUnique({
          where: { id: report.targetMessageId },
          select: {
            id: true,
            body: true,
            createdAt: true,
            sender: { select: publicUserSelect },
            room: {
              select: {
                partnerRequest: {
                  select: {
                    post: { select: { id: true, title: true, message: true, createdAt: true } }
                  }
                }
              }
            }
          }
        })
      : null
  ]);

  return {
    ...report,
    targetUser,
    targetPost: targetPost ?? targetRequest?.post ?? targetMessage?.room.partnerRequest.post ?? null,
    targetRequest,
    targetMessage
  };
}

export async function updateAdminReportStatus(id: string, status: ReportStatus) {
  const result = await prisma.report.updateMany({
    where: { id },
    data: { status }
  });

  return result.count > 0;
}

function compact<T>(values: Array<T | null | undefined>) {
  return values.filter((value): value is T => value != null);
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}
