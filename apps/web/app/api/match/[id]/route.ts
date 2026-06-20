import { prisma } from "@table-tennis/db";
import {
  dataResponse,
  errorResponse,
  nullableText,
  requireUserId,
  validationErrorResponse
} from "@/lib/api";
import { matchSchema } from "@/lib/validators";

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

export async function GET(_request: Request, { params }: Params) {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  const { id } = await params;
  const record = await prisma.matchRecord.findFirst({
    where: { id, userId },
    include: { equipment: true }
  });

  if (!record) {
    return errorResponse("試合記録が見つかりません", 404);
  }

  return dataResponse(record);
}

export async function PATCH(request: Request, { params }: Params) {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  try {
    const { id } = await params;
    const body = matchSchema.parse(await request.json());

    if (!(await ensureEquipment(userId, body.equipmentId))) {
      return errorResponse("指定された用具が見つかりません", 400);
    }

    const result = await prisma.matchRecord.updateMany({
      where: { id, userId },
      data: {
        ...(body.equipmentId !== undefined ? { equipmentId: body.equipmentId } : {}),
        playedAt: new Date(body.playedAt),
        opponentName: body.opponentName,
        opponentTeam: nullableText(body.opponentTeam),
        matchType: body.matchType,
        scores: body.scores,
        result: body.result,
        memo: nullableText(body.memo)
      }
    });

    if (result.count === 0) {
      return errorResponse("試合記録が見つかりません", 404);
    }

    const record = await prisma.matchRecord.findFirstOrThrow({
      where: { id, userId },
      include: { equipment: true }
    });

    return dataResponse(record);
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
  const result = await prisma.matchRecord.deleteMany({
    where: { id, userId }
  });

  if (result.count === 0) {
    return errorResponse("試合記録が見つかりません", 404);
  }

  return dataResponse({ id });
}
