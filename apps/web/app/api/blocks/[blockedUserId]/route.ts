import { prisma } from "@table-tennis/db";
import { errorResponse, requireUserId } from "@/lib/api";

type RouteContext = {
  params: Promise<{ blockedUserId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  const { blockedUserId } = await context.params;

  await prisma.userBlock.deleteMany({
    where: { blockerId: userId, blockedId: blockedUserId }
  });

  return Response.json({ ok: true });
}
