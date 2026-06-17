import { prisma } from "@table-tennis/db";
import { Card, PageHeader } from "@/components/ui";
import { PracticeForm } from "@/components/practice-form";
import { serializeEquipmentList } from "@/lib/serialize";
import { getRequiredUserId } from "@/lib/server-auth";

export default async function NewPracticePage() {
  const userId = await getRequiredUserId();
  const equipment = await prisma.equipment.findMany({
    where: { userId },
    orderBy: [{ isCurrent: "desc" }, { updatedAt: "desc" }]
  });

  return (
    <>
      <PageHeader title="練習記録を作成" description="今日の練習内容を残します。" />
      <Card>
        <PracticeForm equipment={serializeEquipmentList(equipment)} />
      </Card>
    </>
  );
}
