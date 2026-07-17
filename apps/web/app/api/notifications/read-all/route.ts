import { prisma } from "@table-tennis/db";
import { errorResponse, requireUserId } from "@/lib/api";

export async function POST() {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() }
  });

  return Response.json({ ok: true });
}
