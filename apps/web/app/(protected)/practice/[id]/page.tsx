import { notFound } from "next/navigation";
import { prisma } from "@table-tennis/db";
import { Card, PageHeader } from "@/components/ui";
import { PracticeForm } from "@/components/practice-form";
import { serializePractice } from "@/lib/serialize";
import { getRequiredUserId } from "@/lib/server-auth";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PracticeDetailPage({ params }: PageProps) {
  const userId = await getRequiredUserId();
  const { id } = await params;
  const practice = await prisma.practiceLog.findFirst({
    where: { id, userId },
    include: { equipment: true }
  });

  if (!practice) {
    notFound();
  }

  return (
    <>
      <PageHeader title="練習記録の詳細" description="内容を編集できます。" />
      <Card>
        <PracticeForm practice={serializePractice(practice)} />
      </Card>
    </>
  );
}
