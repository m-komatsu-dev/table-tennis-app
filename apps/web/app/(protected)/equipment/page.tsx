import { prisma } from "@table-tennis/db";
import { EquipmentManager } from "@/components/equipment-manager";
import { PageHeader } from "@/components/ui";
import { serializeEquipmentList } from "@/lib/serialize";
import { getRequiredUserId } from "@/lib/server-auth";

export default async function EquipmentPage() {
  const userId = await getRequiredUserId();
  const equipment = await prisma.equipment.findMany({
    where: { userId },
    orderBy: [{ isCurrent: "desc" }, { updatedAt: "desc" }]
  });

  return (
    <>
      <PageHeader title="用具管理" description="ラケットとラバーの組み合わせを管理します。" />
      <EquipmentManager initialEquipment={serializeEquipmentList(equipment)} />
    </>
  );
}
