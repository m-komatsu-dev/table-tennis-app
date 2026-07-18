import { NextResponse } from "next/server";
import { legalConfig } from "@/lib/legal-config";
import {
  buildMobileOAuthCallbackUrl,
  findValidMobileOAuthBrowserFlow,
  mobileOAuthBrowserQuerySchema,
  mobileOAuthIntentCookieName,
  normalizeMobileOAuthErrorCode
} from "@/lib/mobile-oauth-flow";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = mobileOAuthBrowserQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  const error = normalizeMobileOAuthErrorCode(url.searchParams.get("error"));

  if (!parsed.success) {
    return redirectToApp({
      error: "invalid_request",
      state: url.searchParams.get("state") ?? undefined
    });
  }

  const flow = await findValidMobileOAuthBrowserFlow(parsed.data.flow, parsed.data.state);

  if (!flow) {
    return redirectToApp({
      error: "expired",
      state: parsed.data.state
    });
  }

  return redirectToApp({
    error,
    state: parsed.data.state
  });
}

function redirectToApp(params: { error: ReturnType<typeof normalizeMobileOAuthErrorCode>; state?: string }) {
  const response = new NextResponse(null, {
    status: 302,
    headers: {
      Location: buildMobileOAuthCallbackUrl(params)
    }
  });
  response.cookies.delete(mobileOAuthIntentCookieName);
  response.cookies.delete(legalConfig.consentIntentCookieName);

  return response;
}
