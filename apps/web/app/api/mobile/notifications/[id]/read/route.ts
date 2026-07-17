import { prisma } from "@table-tennis/db";
import { mobileError, mobileJson, requireMobileAuth } from "@/lib/mobile-api";
import { serializeNotification } from "@/lib/notifications";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const userId = await requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  const { id } = await context.params;
  const notification = await prisma.notification.findFirst({
    where: { id, userId }
  });

  if (!notification) {
    return mobileError("通知を読み込めませんでした。", 404);
  }

  if (notification.isRead) {
    return mobileJson({ notification: serializeNotification(notification) });
  }

  const updated = await prisma.notification.update({
    where: { id: notification.id },
    data: { isRead: true, readAt: new Date() }
  });

  return mobileJson({ notification: serializeNotification(updated) });
}
