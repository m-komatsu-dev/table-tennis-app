import { NextResponse } from "next/server";
import { z } from "zod";
import { MobileAuthConfigError } from "@/lib/mobile-auth";
import { mobileError, mobileJson, mobileValidationError } from "@/lib/mobile-api";
import {
  consumeMobileOAuthRateLimit,
  exchangeMobileOAuthCode,
  mobileOAuthExchangeSchema
} from "@/lib/mobile-oauth-flow";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rateLimit = consumeMobileOAuthRateLimit(request, "mobile-google-exchange");

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "しばらく待ってからもう一度お試しください" },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) }
      }
    );
  }

  try {
    const body = mobileOAuthExchangeSchema.parse(await request.json());
    const result = await exchangeMobileOAuthCode(body);

    if (!result.ok) {
      return mobileError("Googleログインを完了できませんでした", 401);
    }

    return mobileJson({
      accessToken: result.accessToken,
      user: result.user
    });
  } catch (error) {
    if (error instanceof MobileAuthConfigError) {
      return mobileError("モバイル認証設定が不足しています", 500);
    }

    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return mobileValidationError(error);
    }

    return mobileError("Googleログインを完了できませんでした", 500);
  }
}
