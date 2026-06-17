import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";

export function dataResponse<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function errorResponse(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function requireUserId() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return session.user.id;
}

export function validationErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return errorResponse(error.issues[0]?.message ?? "入力内容を確認してください", 400);
  }

  return errorResponse("入力内容を確認してください", 400);
}

export function nullableText(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
