import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@table-tennis/db";
import { requireMobileUserId } from "@/lib/mobile-auth";

export function mobileJson<T>(body: T, init?: ResponseInit) {
  return NextResponse.json(body, init);
}

export function mobileError(error: string, status = 400) {
  return mobileJson({ error }, { status });
}

export function mobileValidationError(error: unknown) {
  if (error instanceof ZodError) {
    return mobileError(error.issues[0]?.message ?? "入力内容を確認してください", 400);
  }

  return mobileError("入力内容を確認してください", 400);
}

export function nullableMobileText(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function requireMobileAuth(request: Request) {
  const userId = requireMobileUserId(request);

  if (!userId) {
    return null;
  }

  return userId;
}

export async function ensureMobilePracticeMenu(userId: string, practiceMenuId?: string | null) {
  if (!practiceMenuId) {
    return true;
  }

  const menu = await prisma.practiceMenu.findFirst({
    where: { id: practiceMenuId, userId },
    select: { id: true }
  });

  return Boolean(menu);
}
