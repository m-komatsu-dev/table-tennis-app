import { prisma } from "@table-tennis/db";
import {
  dataResponse,
  errorResponse,
  nullableText,
  requireUserId,
  validationErrorResponse
} from "@/lib/api";
import { practiceSchema } from "@/lib/validators";

async function ensureEquipment(userId: string, equipmentId?: string | null) {
  if (!equipmentId) {
    return true;
  }

  const equipment = await prisma.equipment.findFirst({
    where: { id: equipmentId, userId },
    select: { id: true }
  });

  return Boolean(equipment);
}

async function ensurePracticeMenu(userId: string, practiceMenuId?: string | null) {
  if (!practiceMenuId) return true;
  return Boolean(await prisma.practiceMenu.findFirst({
    where: { id: practiceMenuId, userId },
    select: { id: true }
  }));
}

export async function GET() {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  const logs = await prisma.practiceLog.findMany({
    where: { userId },
    include: { equipment: true, practiceMenu: { select: { id: true, title: true } } },
    orderBy: { practicedAt: "desc" }
  });

  return dataResponse(logs);
}

export async function POST(request: Request) {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  try {
    const body = practiceSchema.parse(await request.json());

    if (!(await ensureEquipment(userId, body.equipmentId))) {
      return errorResponse("指定された用具が見つかりません", 400);
    }

    if (!(await ensurePracticeMenu(userId, body.practiceMenuId))) {
      return errorResponse("指定された練習メニューが見つかりません", 400);
    }

    const log = await prisma.practiceLog.create({
      data: {
        userId,
        practicedAt: new Date(body.practicedAt),
        durationMin: body.durationMin,
        location: nullableText(body.location),
        content: nullableText(body.content),
        equipmentId: body.equipmentId ?? null,
        practiceMenuId: body.practiceMenuId ?? null,
        isPublic: body.isPublic
      },
      include: { equipment: true, practiceMenu: { select: { id: true, title: true } } }
    });

    return dataResponse(log, { status: 201 });
  } catch (error) {
    return validationErrorResponse(error);
  }
}
