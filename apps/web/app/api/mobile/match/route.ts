import { prisma } from "@table-tennis/db";
import { mobileError, mobileJson, mobileValidationError, nullableMobileText, requireMobileAuth } from "@/lib/mobile-api";
import { serializeMatch, serializeMatchList } from "@/lib/serialize";
import { matchSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const userId = requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  const records = await prisma.matchRecord.findMany({
    where: { userId },
    include: { equipment: true },
    orderBy: { playedAt: "desc" }
  });

  return mobileJson({ matchRecords: serializeMatchList(records) });
}

export async function POST(request: Request) {
  const userId = requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  try {
    const body = matchSchema.parse(await request.json());
    const record = await prisma.matchRecord.create({
      data: {
        userId,
        playedAt: new Date(body.playedAt),
        opponentName: body.opponentName,
        opponentTeam: nullableMobileText(body.opponentTeam),
        matchType: body.matchType,
        scores: body.scores,
        result: body.result,
        memo: nullableMobileText(body.memo),
        equipmentId: null
      },
      include: { equipment: true }
    });

    return mobileJson({ matchRecord: serializeMatch(record) }, { status: 201 });
  } catch (error) {
    return mobileValidationError(error);
  }
}
