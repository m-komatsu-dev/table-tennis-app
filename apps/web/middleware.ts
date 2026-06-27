import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPrefixes = [
  "/dashboard",
  "/practice",
  "/match",
  "/calendar",
  "/equipment",
  "/profile"
];

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

export async function middleware(req: NextRequest) {
  const isProtected = protectedPrefixes.some((prefix) =>
    req.nextUrl.pathname.startsWith(prefix)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: authSecret
  });

  if (!token?.id) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
};
