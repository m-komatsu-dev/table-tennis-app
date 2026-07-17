import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@table-tennis/db";
import type { Equipment, PracticeLog, PracticeMenu } from "@table-tennis/db";
import { getBearerToken, verifyMobileAccessToken } from "@/lib/mobile-auth";
import { serializePractice } from "@/lib/serialize";

type PracticeWithEquipment = PracticeLog & {
  equipment: Equipment | null;
  practiceMenu: Pick<PracticeMenu, "id" | "title"> | null;
};

const mobilePracticeMemoMarker = "\n\nメモ\n";
const mobilePracticeMemoHeading = "メモ\n";

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

export async function getMobileAuthContext(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  const payload = verifyMobileAccessToken(token);

  if (!payload) {
    return null;
  }

  const userExists = await prisma.user.count({
    where: { id: payload.userId }
  });

  if (userExists !== 1) {
    return null;
  }

  return payload;
}

export async function requireMobileAuth(request: Request) {
  const context = await getMobileAuthContext(request);
  const userId = context?.userId ?? null;

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

export function combineMobilePracticeContent(content: string | null | undefined, memo: string | null | undefined) {
  const cleanContent = nullableMobileText(content);
  const cleanMemo = nullableMobileText(memo);

  if (cleanContent && cleanMemo) {
    return `${cleanContent}${mobilePracticeMemoMarker}${cleanMemo}`;
  }

  if (cleanMemo) {
    return `${mobilePracticeMemoHeading}${cleanMemo}`;
  }

  return cleanContent;
}

export function splitMobilePracticeContent(value: string | null | undefined) {
  const text = nullableMobileText(value);

  if (!text) {
    return { content: null, memo: null };
  }

  const markerIndex = text.indexOf(mobilePracticeMemoMarker);

  if (markerIndex >= 0) {
    return {
      content: nullableMobileText(text.slice(0, markerIndex)),
      memo: nullableMobileText(text.slice(markerIndex + mobilePracticeMemoMarker.length))
    };
  }

  if (text.startsWith(mobilePracticeMemoHeading)) {
    return {
      content: null,
      memo: nullableMobileText(text.slice(mobilePracticeMemoHeading.length))
    };
  }

  return { content: text, memo: null };
}

export function serializeMobilePractice(log: PracticeWithEquipment) {
  const practice = serializePractice(log);
  const split = splitMobilePracticeContent(practice.content);

  return {
    ...practice,
    content: split.content,
    memo: split.memo
  };
}

export function serializeMobilePracticeList(logs: PracticeWithEquipment[]) {
  return logs.map(serializeMobilePractice);
}
