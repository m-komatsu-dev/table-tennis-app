import { prisma } from "@table-tennis/db";
import { errorResponse, requireUserId } from "@/lib/api";
import { serializeNotification } from "@/lib/notifications";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  const { id } = await context.params;
  const notification = await prisma.notification.findFirst({
    where: { id, userId }
  });

  if (!notification) {
    return errorResponse("通知を読み込めませんでした。", 404);
  }

  if (notification.isRead) {
    return Response.json({ notification: serializeNotification(notification) });
  }

  const updated = await prisma.notification.update({
    where: { id: notification.id },
    data: { isRead: true, readAt: new Date() }
  });

  return Response.json({ notification: serializeNotification(updated) });
}
