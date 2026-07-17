import { NextResponse } from "next/server";
import { z } from "zod";
import { legalConfig, legalConsentRequiredMessage } from "@/lib/legal-config";
import { legalConsentSchema } from "@/lib/validators";

const legalConsentIntentSchema = z.object({
  legalConsent: legalConsentSchema
});

export async function POST(request: Request) {
  const parsed = legalConsentIntentSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json({ error: legalConsentRequiredMessage }, { status: 400 });
  }

  const response = NextResponse.json({ data: { ok: true } });
  response.cookies.set({
    name: legalConfig.consentIntentCookieName,
    value: "true",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60
  });

  return response;
}
