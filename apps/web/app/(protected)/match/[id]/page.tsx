import { notFound } from "next/navigation";
import { prisma } from "@table-tennis/db";
import { MatchScoreSheet } from "@/components/match-score-sheet";
import { Card, PageHeader } from "@/components/ui";
import { MatchForm } from "@/components/match-form";
import { serializeEquipmentList, serializeMatch } from "@/lib/serialize";
import { getRequiredUserId } from "@/lib/server-auth";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function MatchDetailPage({ params }: PageProps) {
  const userId = await getRequiredUserId();
  const { id } = await params;
  const [record, player, equipment] = await Promise.all([
    prisma.matchRecord.findFirst({
      where: { id, userId },
      include: { equipment: true }
    }),
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, club: true, level: true }
    }),
    prisma.equipment.findMany({
      where: { userId },
      orderBy: [{ isCurrent: "desc" }, { updatedAt: "desc" }]
    })
  ]);

  if (!record) {
    notFound();
  }

  const match = serializeMatch(record);

  return (
    <>
      <PageHeader title="試合記録の詳細" description="スコアシートと登録内容を確認できます。" />
      <MatchScoreSheet
        matchType={match.matchType}
        memo={match.memo}
        equipmentName={match.equipment?.blade ?? null}
        opponentName={match.opponentName}
        opponentTeam={match.opponentTeam}
        playedAt={match.playedAt}
        playerClub={player.club}
        playerLevel={player.level}
        playerName={player.name}
        result={match.result}
        scores={match.scores}
      />
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-slate-950">記録を編集</h2>
        <Card className="p-5 sm:p-7">
          <MatchForm equipment={serializeEquipmentList(equipment)} match={match} />
        </Card>
      </section>
    </>
  );
}
