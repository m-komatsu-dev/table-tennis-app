import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@table-tennis/db";
import { loginSchema } from "@/lib/validators";

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

      const email = profile?.email?.toLowerCase();
      const googleId = profile?.sub;

      if (!email || !googleId) {
        return false;
      }

      const name =
        typeof profile.name === "string" && profile.name.trim().length > 0
          ? profile.name
          : email.split("@")[0];
      const avatarUrl =
        typeof profile.picture === "string" && profile.picture.trim().length > 0
          ? profile.picture
          : undefined;

      await prisma.user.upsert({
        where: { email },
        create: {
          email,
          name,
          googleId,
          avatarUrl
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

      if (account?.provider === "google" && profile?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: profile.email.toLowerCase() },
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

      return session;
    }
  }
});
