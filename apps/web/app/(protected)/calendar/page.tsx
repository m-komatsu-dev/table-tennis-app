import { prisma } from "@table-tennis/db";
import { RecordCalendar } from "@/components/record-calendar";
import { PageHeader } from "@/components/ui";
import { getRequiredUserId } from "@/lib/server-auth";

export default async function CalendarPage() {
  const userId = await getRequiredUserId();
  const [practiceRecords, matchRecords] = await Promise.all([
    prisma.practiceLog.findMany({
      where: { userId },
      select: { id: true, practicedAt: true, durationMin: true },
      orderBy: { practicedAt: "asc" }
    }),
    prisma.matchRecord.findMany({
      where: { userId },
      select: { id: true, playedAt: true, opponentName: true },
      orderBy: { playedAt: "asc" }
    })
  ]);

  return (
    <>
      <PageHeader title="カレンダー" description="練習と試合の記録を月ごとに確認できます。" />
      <RecordCalendar
        matchRecords={matchRecords.map((record) => ({
          ...record,
          playedAt: record.playedAt.toISOString()
        }))}
        practiceRecords={practiceRecords.map((record) => ({
          ...record,
          practicedAt: record.practicedAt.toISOString()
        }))}
        variant="detailed"
      />
    </>
  );
}
