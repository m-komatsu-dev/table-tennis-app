import { prisma } from "@table-tennis/db";
import { z } from "zod";
import { createMobileAccessToken, MobileAuthConfigError } from "@/lib/mobile-auth";
import { mobileError, mobileJson, mobileValidationError } from "@/lib/mobile-api";
import { legalConfig, legalConsentRequiredMessage } from "@/lib/legal-config";
import {
  GoogleAuthConfigError,
  GoogleIdTokenVerificationError,
  verifyGoogleIdToken
} from "@/lib/google-id-token";

export const runtime = "nodejs";

const mobileGoogleAuthSchema = z.object({
  idToken: z.string().trim().min(1, "Googleログイン情報が不正です"),
  nonce: z.string().trim().min(1).optional(),
  legalConsent: z.boolean().optional()
});

function displayName(name: string | null, email: string) {
  return name && name.length > 0 ? name : email.split("@")[0];
}

export async function POST(request: Request) {
  try {
    const body = mobileGoogleAuthSchema.parse(await request.json());
    const googleUser = await verifyGoogleIdToken(body.idToken, body.nonce);

    const existingGoogleUser = await prisma.user.findUnique({
      where: { googleId: googleUser.sub },
      select: { id: true, email: true, name: true }
    });

    if (existingGoogleUser && existingGoogleUser.email !== googleUser.email) {
      return mobileError("Googleログインに失敗しました", 401);
    }

    const existingEmailUser = await prisma.user.findUnique({
      where: { email: googleUser.email },
      select: { id: true, email: true, name: true, passwordHash: true, googleId: true }
    });

    if (existingEmailUser?.googleId && existingEmailUser.googleId !== googleUser.sub) {
      return mobileError("Googleログインに失敗しました", 401);
    }

    if (existingEmailUser?.passwordHash && !existingEmailUser.googleId) {
      return mobileError("このメールアドレスは別の方法で登録されています", 409);
    }

    if (!existingGoogleUser && !existingEmailUser && body.legalConsent !== true) {
      return mobileError(legalConsentRequiredMessage, 400);
    }

    const name = displayName(googleUser.name, googleUser.email);
    const user = existingEmailUser
      ? await prisma.user.update({
          where: { id: existingEmailUser.id },
          data: {
            googleId: googleUser.sub,
            name,
            avatarUrl: googleUser.picture
          },
          select: { id: true, name: true, email: true }
        })
      : await prisma.user.create({
          data: {
            email: googleUser.email,
            name,
            googleId: googleUser.sub,
            avatarUrl: googleUser.picture,
            legalConsentAt: new Date(),
            termsVersion: legalConfig.termsVersion,
            privacyPolicyVersion: legalConfig.privacyVersion
          },
          select: { id: true, name: true, email: true }
        });

    const accessToken = createMobileAccessToken(user.id);

    return mobileJson({
      accessToken,
      user
    });
  } catch (error) {
    if (error instanceof GoogleAuthConfigError || error instanceof MobileAuthConfigError) {
      return mobileError("サーバー側でエラーが発生しました", 500);
    }

    if (error instanceof GoogleIdTokenVerificationError) {
      return mobileError("Googleログインに失敗しました", 401);
    }

    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return mobileValidationError(error);
    }

    return mobileError("サーバー側でエラーが発生しました", 500);
  }
}
