import { prisma } from "@table-tennis/db";
import { mobileError, mobileJson, mobileValidationError, nullableMobileText, requireMobileAuth, ensureMobilePracticeMenu } from "@/lib/mobile-api";
import { serializePractice, serializePracticeList } from "@/lib/serialize";
import { practiceSchema } from "@/lib/validators";

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

  return mobileJson({ practiceLogs: serializePracticeList(logs) });
}

export async function POST(request: Request) {
  const userId = requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  try {
    const body = practiceSchema.parse(await request.json());

    if (!(await ensureMobilePracticeMenu(userId, body.practiceMenuId))) {
      return mobileError("指定された練習メニューが見つかりません", 400);
    }

    const log = await prisma.practiceLog.create({
      data: {
        userId,
        practicedAt: new Date(body.practicedAt),
        durationMin: body.durationMin,
        location: nullableMobileText(body.location),
        content: nullableMobileText(body.content),
        practiceMenuId: body.practiceMenuId ?? null,
        equipmentId: null
      },
      include: { equipment: true, practiceMenu: { select: { id: true, title: true } } }
    });

    return mobileJson({ practiceLog: serializePractice(log) }, { status: 201 });
  } catch (error) {
    return mobileValidationError(error);
  }
}
