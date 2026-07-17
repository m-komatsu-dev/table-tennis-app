import { prisma } from "@table-tennis/db";
import { mobileError, mobileJson, requireMobileAuth } from "@/lib/mobile-api";

export async function POST(request: Request) {
  const userId = requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() }
  });

  return mobileJson({ ok: true });
}
