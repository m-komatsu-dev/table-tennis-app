import { prisma } from "@table-tennis/db";
import { getMyFeedbacks, serializePublicFeedback } from "@/lib/feedback";
import { mobileError, mobileJson, requireMobileAuth } from "@/lib/mobile-api";

export async function GET(request: Request) {
  const userId = requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });

  if (!user) {
    return mobileError("認証が必要です", 401);
  }

  const feedbacks = await getMyFeedbacks(userId);
  return mobileJson({ feedbacks: feedbacks.map(serializePublicFeedback) });
}
