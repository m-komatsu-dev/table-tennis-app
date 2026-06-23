import { prisma } from "@table-tennis/db";
import { dataResponse, errorResponse, requireUserId, validationErrorResponse } from "@/lib/api";
import { toPracticeMenuCreateData } from "@/lib/ai/practice-menu";
import { aiRateLimitResponse } from "@/lib/ai/route-helpers";
import { aiPracticeMenuSuggestionSchema } from "@/lib/ai/schemas";

export async function POST(request: Request) {
  const userId = await requireUserId();

  if (!userId) return errorResponse("認証が必要です", 401);

  const rateLimitResponse = aiRateLimitResponse(userId, "practice-menu-save", 10);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const suggestion = aiPracticeMenuSuggestionSchema.parse(await request.json());
    const menu = await prisma.practiceMenu.create({
      data: toPracticeMenuCreateData(userId, suggestion),
      select: { id: true }
    });

    return dataResponse(menu, { status: 201 });
  } catch (error) {
    return validationErrorResponse(error);
  }
}
