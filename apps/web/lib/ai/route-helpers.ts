import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { GeminiConfigurationError, GeminiResponseError } from "./gemini";
import { consumeAiRateLimit } from "./rate-limit";

export function aiRateLimitResponse(userId: string, operation: string, limit = 3) {
  const rateLimit = consumeAiRateLimit(`${userId}:${operation}`, { limit });

  if (rateLimit.allowed) return null;

  return NextResponse.json(
    { error: `AIコーチの利用回数が上限に達しました。${rateLimit.retryAfterSeconds}秒後に再試行してください。` },
    {
      status: 429,
      headers: { "Retry-After": String(rateLimit.retryAfterSeconds) }
    }
  );
}

export function aiGenerationErrorResponse(error: unknown) {
  if (error instanceof GeminiConfigurationError) {
    return errorResponse(
      "Gemini APIキーが設定されていません。管理者がGEMINI_API_KEYを設定してください。",
      503
    );
  }

  if (error instanceof GeminiResponseError) {
    return errorResponse("AIの応答形式が正しくありませんでした。もう一度お試しください。", 502);
  }

  return errorResponse("AIコーチへの接続に失敗しました。時間をおいて再試行してください。", 502);
}
