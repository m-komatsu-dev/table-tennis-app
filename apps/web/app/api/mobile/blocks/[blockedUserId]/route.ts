import { prisma } from "@table-tennis/db";
import { mobileError, mobileJson, requireMobileAuth } from "@/lib/mobile-api";

type RouteContext = {
  params: Promise<{ blockedUserId: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  const userId = await requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  const { blockedUserId } = await context.params;

  await prisma.userBlock.deleteMany({
    where: { blockerId: userId, blockedId: blockedUserId }
  });

  return mobileJson({ ok: true });
}
