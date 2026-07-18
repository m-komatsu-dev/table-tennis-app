import { NextResponse } from "next/server";
import { legalConfig } from "@/lib/legal-config";
import {
  buildMobileOAuthCallbackUrl,
  findValidMobileOAuthBrowserFlow,
  mobileOAuthBrowserQuerySchema,
  mobileOAuthIntentCookieName,
  serializeMobileOAuthIntent
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

  const flow = await findValidMobileOAuthBrowserFlow(parsed.data.flow, parsed.data.state);

  if (!flow) {
    return redirectToApp({
      error: "expired",
      state: parsed.data.state
    });
  }

  const signInUrl = new URL("/mobile-auth/google/sign-in", url.origin);
  signInUrl.searchParams.set("flow", parsed.data.flow);
  signInUrl.searchParams.set("state", parsed.data.state);

  const response = NextResponse.redirect(signInUrl);
  response.cookies.set({
    name: mobileOAuthIntentCookieName,
    value: serializeMobileOAuthIntent(parsed.data.flow, parsed.data.state),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60
  });

  if (flow.legalConsent) {
    response.cookies.set({
      name: legalConfig.consentIntentCookieName,
      value: "true",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 10 * 60
    });
  }

  return response;
}

function redirectToApp(params: { error: "invalid_request" | "expired"; state?: string }) {
  return new NextResponse(null, {
    status: 302,
    headers: {
      Location: buildMobileOAuthCallbackUrl(params)
    }
  });
}
