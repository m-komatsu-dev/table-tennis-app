import { dataResponse, errorResponse, requireUserId } from "@/lib/api";
import { buildAiCoachContext } from "@/lib/ai/context";
import { generateGeminiJson } from "@/lib/ai/gemini";
import { buildPracticeMenuPrompt } from "@/lib/ai/prompts";
import { aiGenerationErrorResponse, aiRateLimitResponse } from "@/lib/ai/route-helpers";
import {
  aiPracticeMenuResponseJsonSchema,
  aiPracticeMenuSuggestionSchema
} from "@/lib/ai/schemas";

export const runtime = "nodejs";

export async function POST() {
  const userId = await requireUserId();

  if (!userId) return errorResponse("認証が必要です", 401);

  const rateLimitResponse = aiRateLimitResponse(userId, "practice-menu");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const context = await buildAiCoachContext(userId);
    const result = await generateGeminiJson({
      prompt: buildPracticeMenuPrompt(context),
      schema: aiPracticeMenuSuggestionSchema,
      responseJsonSchema: aiPracticeMenuResponseJsonSchema
    });

    return dataResponse({ result, meta: context.recordCounts });
  } catch (error) {
    return aiGenerationErrorResponse(error);
  }
}
