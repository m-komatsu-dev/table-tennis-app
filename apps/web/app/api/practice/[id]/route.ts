import { prisma } from "@table-tennis/db";
import {
  dataResponse,
  errorResponse,
  nullableText,
  requireUserId,
  validationErrorResponse
} from "@/lib/api";
import { practiceSchema } from "@/lib/validators";

type Params = {
  params: Promise<{ id: string }>;
};

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

export async function GET(_request: Request, { params }: Params) {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  const { id } = await params;
  const log = await prisma.practiceLog.findFirst({
    where: { id, userId },
    include: { equipment: true, practiceMenu: { select: { id: true, title: true } } }
  });

  if (!log) {
    return errorResponse("練習記録が見つかりません", 404);
  }

  return dataResponse(log);
}

export async function PATCH(request: Request, { params }: Params) {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  try {
    const { id } = await params;
    const body = practiceSchema.parse(await request.json());

    if (!(await ensureEquipment(userId, body.equipmentId))) {
      return errorResponse("指定された用具が見つかりません", 400);
    }

    if (!(await ensurePracticeMenu(userId, body.practiceMenuId))) {
      return errorResponse("指定された練習メニューが見つかりません", 400);
    }

    const result = await prisma.practiceLog.updateMany({
      where: { id, userId },
      data: {
        practicedAt: new Date(body.practicedAt),
        durationMin: body.durationMin,
        location: nullableText(body.location),
        content: nullableText(body.content),
        isPublic: body.isPublic,
        ...(body.equipmentId !== undefined ? { equipmentId: body.equipmentId } : {}),
        ...(body.practiceMenuId !== undefined ? { practiceMenuId: body.practiceMenuId } : {})
      }
    });

    if (result.count === 0) {
      return errorResponse("練習記録が見つかりません", 404);
    }

    const log = await prisma.practiceLog.findFirstOrThrow({
      where: { id, userId },
      include: { equipment: true, practiceMenu: { select: { id: true, title: true } } }
    });

    return dataResponse(log);
  } catch (error) {
    return validationErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  const { id } = await params;
  const result = await prisma.practiceLog.deleteMany({
    where: { id, userId }
  });

  if (result.count === 0) {
    return errorResponse("練習記録が見つかりません", 404);
  }

  return dataResponse({ id });
}
