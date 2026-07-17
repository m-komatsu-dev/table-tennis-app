import { prisma } from "@table-tennis/db";
import { errorResponse, requireUserId, validationErrorResponse } from "@/lib/api";
import { createFeedback, FeedbackError, serializePublicFeedback } from "@/lib/feedback";

export async function POST(request: Request) {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });

    if (!user) {
      return errorResponse("認証が必要です", 401);
    }

    const feedback = await createFeedback(userId, "WEB", await request.json());
    return Response.json({ feedback: serializePublicFeedback(feedback) }, { status: 201 });
  } catch (error) {
    if (error instanceof FeedbackError) {
      return errorResponse(error.message, error.status);
    }

    return validationErrorResponse(error);
  }
}
