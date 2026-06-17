import { prisma } from "@table-tennis/db";
import { dataResponse, errorResponse, requireUserId } from "@/lib/api";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET() {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  const now = new Date();
  const firstMonth = addMonths(startOfMonth(now), -5);
  const afterLastMonth = addMonths(startOfMonth(now), 1);
  const months = Array.from({ length: 6 }, (_, index) => addMonths(firstMonth, index));
  const monthlyMap = new Map(
    months.map((date) => [
      monthKey(date),
      {
        month: monthKey(date),
        practiceMinutes: 0,
        matches: 0,
        wins: 0,
        winRate: 0
      }
    ])
  );

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

  for (const log of practiceLogs) {
    const entry = monthlyMap.get(monthKey(log.practicedAt));
    if (entry) {
      entry.practiceMinutes += log.durationMin;
    }
  }

  for (const match of matches) {
    const entry = monthlyMap.get(monthKey(match.playedAt));
    if (entry) {
      entry.matches += 1;
      if (match.result === "WIN") {
        entry.wins += 1;
      }
    }
  }

  for (const entry of monthlyMap.values()) {
    entry.winRate = entry.matches > 0 ? (entry.wins / entry.matches) * 100 : 0;
  }

  return dataResponse(Array.from(monthlyMap.values()));
}
