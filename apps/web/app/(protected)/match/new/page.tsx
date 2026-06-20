import { prisma } from "@table-tennis/db";
import { Card, PageHeader } from "@/components/ui";
import { MatchForm } from "@/components/match-form";
import { serializeEquipmentList } from "@/lib/serialize";
import { getRequiredUserId } from "@/lib/server-auth";

export default async function NewMatchPage() {
  const userId = await getRequiredUserId();
  const equipment = await prisma.equipment.findMany({
    where: { userId },
    orderBy: [{ isCurrent: "desc" }, { updatedAt: "desc" }]
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="試合記録を作成" description="対戦結果とセットスコアを残します。" />
      <Card className="p-5 sm:p-7">
        <MatchForm equipment={serializeEquipmentList(equipment)} />
      </Card>
    </div>
  );
}
