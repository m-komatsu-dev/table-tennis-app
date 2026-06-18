import { prisma } from "@table-tennis/db";
import { dataResponse, errorResponse, requireUserId } from "@/lib/api";
import { buildMonthlyStats, getMonthlyStatsRange } from "@/lib/stats";

export async function GET() {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  const now = new Date();
  const { firstMonth, afterLastMonth } = getMonthlyStatsRange(now);

  const [practiceLogs, matches] = await Promise.all([
    prisma.practiceLog.findMany({
      where: {
        userId,
        practicedAt: {
          gte: firstMonth,
          lt: afterLastMonth
        }
      },
      select: {
        practicedAt: true,
        durationMin: true
      }
    }),
    prisma.matchRecord.findMany({
      where: {
        userId,
        playedAt: {
          gte: firstMonth,
          lt: afterLastMonth
        }
      },
      select: {
        playedAt: true,
        result: true
      }
    })
  ]);

  return dataResponse(buildMonthlyStats(practiceLogs, matches, now));
}
