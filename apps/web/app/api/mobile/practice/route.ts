import { prisma } from "@table-tennis/db";
import { z } from "zod";
import {
  combineMobilePracticeContent,
  ensureMobilePracticeMenu,
  mobileError,
  mobileJson,
  mobileValidationError,
  nullableMobileText,
  requireMobileAuth,
  serializeMobilePractice,
  serializeMobilePracticeList
} from "@/lib/mobile-api";
import { practiceSchema } from "@/lib/validators";

const mobilePracticeSchema = practiceSchema.extend({
  memo: z.string().trim().max(4000, "メモは4000文字以内で入力してください").optional().nullable()
});

export async function GET(request: Request) {
  const userId = requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  const logs = await prisma.practiceLog.findMany({
    where: { userId },
    include: { equipment: true, practiceMenu: { select: { id: true, title: true } } },
    orderBy: { practicedAt: "desc" }
  });

  return mobileJson({ practiceLogs: serializeMobilePracticeList(logs) });
}

export async function POST(request: Request) {
  const userId = requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  try {
    const body = mobilePracticeSchema.parse(await request.json());

    if (!(await ensureMobilePracticeMenu(userId, body.practiceMenuId))) {
      return mobileError("指定された練習メニューが見つかりません", 400);
    }

    const log = await prisma.practiceLog.create({
      data: {
        userId,
        practicedAt: new Date(body.practicedAt),
        durationMin: body.durationMin,
        location: nullableMobileText(body.location),
        content: combineMobilePracticeContent(body.content, body.memo),
        practiceMenuId: body.practiceMenuId ?? null,
        equipmentId: null,
        isPublic: body.isPublic
      },
      include: { equipment: true, practiceMenu: { select: { id: true, title: true } } }
    });

    return mobileJson({ practiceLog: serializeMobilePractice(log) }, { status: 201 });
  } catch (error) {
    return mobileValidationError(error);
  }
}
