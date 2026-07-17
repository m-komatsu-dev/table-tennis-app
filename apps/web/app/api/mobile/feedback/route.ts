import { prisma } from "@table-tennis/db";
import { createFeedback, FeedbackError, serializePublicFeedback } from "@/lib/feedback";
import { mobileError, mobileJson, mobileValidationError, requireMobileAuth } from "@/lib/mobile-api";

export async function POST(request: Request) {
  const userId = await requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });

    if (!user) {
      return mobileError("認証が必要です", 401);
    }

    const feedback = await createFeedback(userId, "MOBILE", await request.json());
    return mobileJson({ feedback: serializePublicFeedback(feedback) }, { status: 201 });
  } catch (error) {
    if (error instanceof FeedbackError) {
      return mobileError(error.message, error.status);
    }

    return mobileValidationError(error);
  }
}
