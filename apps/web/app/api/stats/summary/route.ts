import { prisma } from "@table-tennis/db";
import { dataResponse, errorResponse, requireUserId } from "@/lib/api";

export async function GET() {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  const [practiceCount, practiceDuration, totalMatches, wins, losses] = await Promise.all([
    prisma.practiceLog.count({ where: { userId } }),
    prisma.practiceLog.aggregate({
      where: { userId },
      _sum: { durationMin: true }
    }),
    prisma.matchRecord.count({ where: { userId } }),
    prisma.matchRecord.count({ where: { userId, result: "WIN" } }),
    prisma.matchRecord.count({ where: { userId, result: "LOSE" } })
  ]);

  const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

  return dataResponse({
    practice: {
      totalCount: practiceCount,
      totalMinutes: practiceDuration._sum.durationMin ?? 0
    },
    match: {
      totalCount: totalMatches,
      winCount: wins,
      loseCount: losses,
      winRate
    }
  });
}
