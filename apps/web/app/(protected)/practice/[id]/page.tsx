import { notFound } from "next/navigation";
import { prisma } from "@table-tennis/db";
import { Card, PageHeader } from "@/components/ui";
import { PracticeForm } from "@/components/practice-form";
import { serializeEquipmentList, serializePractice } from "@/lib/serialize";
import { getRequiredUserId } from "@/lib/server-auth";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PracticeDetailPage({ params }: PageProps) {
  const userId = await getRequiredUserId();
  const { id } = await params;
  const [practice, equipment] = await Promise.all([
    prisma.practiceLog.findFirst({
      where: { id, userId },
      include: { equipment: true }
    }),
    prisma.equipment.findMany({
      where: { userId },
      orderBy: [{ isCurrent: "desc" }, { updatedAt: "desc" }]
    })
  ]);

  if (!practice) {
    notFound();
  }

  return (
    <>
      <PageHeader title="練習記録の詳細" description="内容を編集できます。" />
      <Card>
        <PracticeForm equipment={serializeEquipmentList(equipment)} practice={serializePractice(practice)} />
      </Card>
    </>
  );
}
