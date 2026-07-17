import { prisma } from "@table-tennis/db";
import { errorResponse, requireUserId } from "@/lib/api";
import { getMyFeedbacks, serializePublicFeedback } from "@/lib/feedback";

export async function GET() {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });

  if (!user) {
    return errorResponse("認証が必要です", 401);
  }

  const feedbacks = await getMyFeedbacks(userId);
  return Response.json({ feedbacks: feedbacks.map(serializePublicFeedback) });
}
