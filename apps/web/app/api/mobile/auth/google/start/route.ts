import { NextResponse } from "next/server";
import { z } from "zod";
import { mobileError, mobileJson, mobileValidationError } from "@/lib/mobile-api";
import {
  consumeMobileOAuthRateLimit,
  createMobileOAuthFlow,
  getPublicWebOrigin,
  mobileOAuthStartSchema
} from "@/lib/mobile-oauth-flow";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rateLimit = consumeMobileOAuthRateLimit(request, "mobile-google-start");

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
    const body = mobileOAuthStartSchema.parse(await request.json());
    const flow = await createMobileOAuthFlow({
      state: body.state,
      codeChallenge: body.codeChallenge,
      legalConsent: body.legalConsent,
      origin: getPublicWebOrigin(request)
    });

    return mobileJson({
      authorizationUrl: flow.authorizationUrl
    });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return mobileValidationError(error);
    }

    return mobileError("Googleログインを開始できませんでした", 500);
  }
}
