import { prisma } from "@table-tennis/db";
import { mobileError, mobileJson, mobileValidationError, nullableMobileText, requireMobileAuth } from "@/lib/mobile-api";
import { serializeMatch } from "@/lib/serialize";
import { matchSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const userId = requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  const { id } = await context.params;
  const record = await prisma.matchRecord.findFirst({
    where: { id, userId },
    include: { equipment: true }
  });

  if (!record) {
    return mobileError("試合記録が見つかりません", 404);
  }

  return mobileJson({ matchRecord: serializeMatch(record) });
}

export async function PUT(request: Request, context: RouteContext) {
  const userId = requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  try {
    const { id } = await context.params;
    const body = matchSchema.parse(await request.json());
    const result = await prisma.matchRecord.updateMany({
      where: { id, userId },
      data: {
        playedAt: new Date(body.playedAt),
        opponentName: body.opponentName,
        opponentTeam: nullableMobileText(body.opponentTeam),
        matchType: body.matchType,
        scores: body.scores,
        result: body.result,
        memo: nullableMobileText(body.memo),
        equipmentId: null,
        isPublic: body.isPublic
      }
    });

    if (result.count === 0) {
      return mobileError("試合記録が見つかりません", 404);
    }

    const record = await prisma.matchRecord.findFirstOrThrow({
      where: { id, userId },
      include: { equipment: true }
    });

    return mobileJson({ matchRecord: serializeMatch(record) });
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
  const result = await prisma.matchRecord.deleteMany({
    where: { id, userId }
  });

  if (result.count === 0) {
    return mobileError("試合記録が見つかりません", 404);
  }

  return mobileJson({ ok: true });
}
