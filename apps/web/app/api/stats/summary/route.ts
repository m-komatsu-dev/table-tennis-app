import { prisma } from "@table-tennis/db";
import { dataResponse, errorResponse, requireUserId } from "@/lib/api";

export async function GET() {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  const [practiceCount, practiceDuration, totalMatches, wins, losses, draws, recentPractice, recentMatches] =
    await Promise.all([
      prisma.practiceLog.count({ where: { userId } }),
      prisma.practiceLog.aggregate({
        where: { userId },
        _sum: { durationMin: true }
      }),
      prisma.matchRecord.count({ where: { userId } }),
      prisma.matchRecord.count({ where: { userId, result: "WIN" } }),
      prisma.matchRecord.count({ where: { userId, result: "LOSE" } }),
      prisma.matchRecord.count({ where: { userId, result: "DRAW" } }),
      prisma.practiceLog.findMany({
        where: { userId },
        include: { equipment: true },
        orderBy: { practicedAt: "desc" },
        take: 5
      }),
      prisma.matchRecord.findMany({
        where: { userId },
        orderBy: { playedAt: "desc" },
        take: 5
      })
    ]);

  const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

  return dataResponse({
    practiceCount,
    totalPracticeMinutes: practiceDuration._sum.durationMin ?? 0,
    totalMatches,
    wins,
    losses,
    draws,
    winRate,
    recentPractice,
    recentMatches
  });
}
