import { prisma } from "@table-tennis/db";
import { ensureMobilePracticeMenu, mobileError, mobileJson, mobileValidationError, nullableMobileText, requireMobileAuth } from "@/lib/mobile-api";
import { serializePractice } from "@/lib/serialize";
import { practiceSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const userId = requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  const { id } = await context.params;
  const log = await prisma.practiceLog.findFirst({
    where: { id, userId },
    include: { equipment: true, practiceMenu: { select: { id: true, title: true } } }
  });

  if (!log) {
    return mobileError("練習記録が見つかりません", 404);
  }

  return mobileJson({ practiceLog: serializePractice(log) });
}

export async function PUT(request: Request, context: RouteContext) {
  const userId = requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  try {
    const { id } = await context.params;
    const body = practiceSchema.parse(await request.json());

    if (!(await ensureMobilePracticeMenu(userId, body.practiceMenuId))) {
      return mobileError("指定された練習メニューが見つかりません", 400);
    }

    const result = await prisma.practiceLog.updateMany({
      where: { id, userId },
      data: {
        practicedAt: new Date(body.practicedAt),
        durationMin: body.durationMin,
        location: nullableMobileText(body.location),
        content: nullableMobileText(body.content),
        practiceMenuId: body.practiceMenuId ?? null,
        equipmentId: null
      }
    });

    if (result.count === 0) {
      return mobileError("練習記録が見つかりません", 404);
    }

    const log = await prisma.practiceLog.findFirstOrThrow({
      where: { id, userId },
      include: { equipment: true, practiceMenu: { select: { id: true, title: true } } }
    });

    return mobileJson({ practiceLog: serializePractice(log) });
  } catch (error) {
    return mobileValidationError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const userId = requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  const { id } = await context.params;
  const result = await prisma.practiceLog.deleteMany({
    where: { id, userId }
  });

  if (result.count === 0) {
    return mobileError("練習記録が見つかりません", 404);
  }

  return mobileJson({ ok: true });
}
