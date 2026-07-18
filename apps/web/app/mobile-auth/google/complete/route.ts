import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { legalConfig } from "@/lib/legal-config";
import {
  buildMobileOAuthCallbackUrl,
  completeMobileOAuthFlow,
  mobileOAuthBrowserQuerySchema,
  mobileOAuthIntentCookieName,
  type MobileOAuthErrorCode
} from "@/lib/mobile-oauth-flow";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = mobileOAuthBrowserQuerySchema.safeParse(Object.fromEntries(url.searchParams));

  if (!parsed.success) {
    return redirectToApp({
      error: "invalid_request",
      state: url.searchParams.get("state") ?? undefined
    });
  }

  const session = await auth();
  const result = await completeMobileOAuthFlow({
    flowId: parsed.data.flow,
    state: parsed.data.state,
    userId: session?.user?.id,
    googleReauthenticatedAt: session?.user?.googleReauthenticatedAt
  });

  if (!result.ok) {
    return redirectToApp({
      error: result.error,
      state: parsed.data.state
    });
  }

  return redirectToApp({
    code: result.code,
    state: result.state
  });
}

function redirectToApp(params: { code?: string; error?: MobileOAuthErrorCode; state?: string }) {
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
