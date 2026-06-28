import { prisma } from "@table-tennis/db";
import {
  dataResponse,
  errorResponse,
  nullableText,
  requireUserId,
  validationErrorResponse
} from "@/lib/api";
import { matchSchema } from "@/lib/validators";

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

export async function GET() {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  const records = await prisma.matchRecord.findMany({
    where: { userId },
    include: { equipment: true },
    orderBy: { playedAt: "desc" }
  });

  return dataResponse(records);
}

export async function POST(request: Request) {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  try {
    const body = matchSchema.parse(await request.json());

    if (!(await ensureEquipment(userId, body.equipmentId))) {
      return errorResponse("指定された用具が見つかりません", 400);
    }

    const record = await prisma.matchRecord.create({
      data: {
        userId,
        equipmentId: body.equipmentId ?? null,
        playedAt: new Date(body.playedAt),
        opponentName: body.opponentName,
        opponentTeam: nullableText(body.opponentTeam),
        matchType: body.matchType,
        scores: body.scores,
        result: body.result,
        memo: nullableText(body.memo),
        isPublic: body.isPublic
      },
      include: { equipment: true }
    });

    return dataResponse(record, { status: 201 });
  } catch (error) {
    return validationErrorResponse(error);
  }
}
