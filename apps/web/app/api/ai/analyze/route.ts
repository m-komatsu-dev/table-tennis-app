import { dataResponse, errorResponse, requireUserId } from "@/lib/api";
import { buildAiCoachContext } from "@/lib/ai/context";
import { generateGeminiJson } from "@/lib/ai/gemini";
import { buildAnalysisPrompt } from "@/lib/ai/prompts";
import { aiGenerationErrorResponse, aiRateLimitResponse } from "@/lib/ai/route-helpers";
import { aiAnalysisResponseJsonSchema, aiAnalysisResultSchema } from "@/lib/ai/schemas";

export const runtime = "nodejs";

export async function POST() {
  const userId = await requireUserId();

  if (!userId) return errorResponse("認証が必要です", 401);

  const rateLimitResponse = aiRateLimitResponse(userId, "analyze");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const context = await buildAiCoachContext(userId);
    const result = await generateGeminiJson({
      prompt: buildAnalysisPrompt(context),
      schema: aiAnalysisResultSchema,
      responseJsonSchema: aiAnalysisResponseJsonSchema
    });

    return dataResponse({ result, meta: context.recordCounts });
  } catch (error) {
    return aiGenerationErrorResponse(error);
  }
}
