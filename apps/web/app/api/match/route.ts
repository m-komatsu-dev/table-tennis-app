import { prisma } from "@table-tennis/db";
import {
  dataResponse,
  errorResponse,
  nullableText,
  requireUserId,
  validationErrorResponse
} from "@/lib/api";
import { matchSchema } from "@/lib/validators";

export async function GET() {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  const records = await prisma.matchRecord.findMany({
    where: { userId },
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
    const record = await prisma.matchRecord.create({
      data: {
        userId,
        playedAt: new Date(body.playedAt),
        opponentName: body.opponentName,
        matchType: body.matchType,
        scores: body.scores,
        result: body.result,
        memo: nullableText(body.memo)
      }
    });

    return dataResponse(record, { status: 201 });
  } catch (error) {
    return validationErrorResponse(error);
  }
}
