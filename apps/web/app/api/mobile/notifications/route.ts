import { prisma } from "@table-tennis/db";
import { mobileError, mobileJson, requireMobileAuth } from "@/lib/mobile-api";
import { serializeNotification } from "@/lib/notifications";

const maxNotifications = 100;

export async function GET(request: Request) {
  const userId = await requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  const limit = clampLimit(Number(new URL(request.url).searchParams.get("limit") ?? maxNotifications));
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit
    }),
    prisma.notification.count({
      where: { userId, isRead: false }
    })
  ]);

  return mobileJson({
    notifications: notifications.map(serializeNotification),
    unreadCount
  });
}

function clampLimit(limit: number) {
  if (!Number.isFinite(limit)) {
    return maxNotifications;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), maxNotifications);
}
