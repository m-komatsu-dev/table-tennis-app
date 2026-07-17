import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@table-tennis/db";
import { legalConfig } from "@/lib/legal-config";
import { loginSchema } from "@/lib/validators";

type GoogleProfile = {
  email?: string | null;
  email_verified?: boolean | string | null;
  name?: string | null;
  picture?: string | null;
  sub?: string | null;
};

function getSafeGoogleProfile(profile: unknown) {
  return (profile ?? {}) as GoogleProfile;
}

function isVerifiedGoogleEmail(profile: GoogleProfile) {
  return profile.email_verified === true || profile.email_verified === "true";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }),
    Credentials({
      credentials: {
        email: {},
        password: {}
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() }
        });

        if (!user?.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(parsed.data.password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl?.startsWith("data:") ? null : user.avatarUrl
        };
      }
    })
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") {
        return true;
      }

      const googleProfile = getSafeGoogleProfile(profile);
      const email = googleProfile.email?.toLowerCase();
      const googleId = account.providerAccountId ?? googleProfile.sub;

      if (!email || !googleId) {
        return "/login?error=GoogleLoginFailed";
      }

      if (!isVerifiedGoogleEmail(googleProfile)) {
        return "/login?error=GoogleEmailNotVerified";
      }

      const existingGoogleUser = await prisma.user.findUnique({
        where: { googleId },
        select: { id: true, email: true }
      });

      if (existingGoogleUser && existingGoogleUser.email !== email) {
        return "/login?error=GoogleLoginFailed";
      }

      const existingEmailUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true, passwordHash: true, googleId: true }
      });

      if (existingEmailUser?.googleId && existingEmailUser.googleId !== googleId) {
        return "/login?error=GoogleLoginFailed";
      }

      if (existingEmailUser?.passwordHash && !existingEmailUser.googleId) {
        return "/login?error=OAuthAccountNotLinked";
      }

      const isNewUser = !existingGoogleUser && !existingEmailUser;
      const hasLegalConsentIntent =
        (await cookies()).get(legalConfig.consentIntentCookieName)?.value === "true";

      if (isNewUser && !hasLegalConsentIntent) {
        return "/register?error=LegalConsentRequired";
      }

      const name =
        typeof googleProfile.name === "string" && googleProfile.name.trim().length > 0
          ? googleProfile.name
          : email.split("@")[0];
      const avatarUrl =
        typeof googleProfile.picture === "string" && googleProfile.picture.trim().length > 0
          ? googleProfile.picture
          : undefined;

      await prisma.user.upsert({
        where: { email },
        create: {
          email,
          name,
          googleId,
          avatarUrl,
          legalConsentAt: new Date(),
          termsVersion: legalConfig.termsVersion,
          privacyPolicyVersion: legalConfig.privacyVersion
        },
        update: {
          googleId,
          name,
          avatarUrl
        }
      });

      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (user?.id) {
        token.id = user.id;
      }

      const googleProfile = getSafeGoogleProfile(profile);

      if (account?.provider === "google" && googleProfile.email) {
        token.googleReauthenticatedAt = Math.floor(Date.now() / 1000);

        const dbUser = await prisma.user.findUnique({
          where: { email: googleProfile.email.toLowerCase() },
          select: { id: true, name: true, avatarUrl: true }
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.name = dbUser.name;
          token.picture = dbUser.avatarUrl?.startsWith("data:") ? null : dbUser.avatarUrl;
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }

      if (session.user && typeof token.googleReauthenticatedAt === "number") {
        session.user.googleReauthenticatedAt = token.googleReauthenticatedAt;
      }

      return session;
    }
  }
});
