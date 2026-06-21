import { notFound } from "next/navigation";
import { prisma } from "@table-tennis/db";
import { PracticeMenuForm } from "@/components/practice-menu-form";
import { Card, PageHeader } from "@/components/ui";
import { serializePracticeMenu } from "@/lib/serialize";
import { getRequiredUserId } from "@/lib/server-auth";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditPracticeMenuPage({ params }: PageProps) {
  const userId = await getRequiredUserId();
  const { id } = await params;
  const menu = await prisma.practiceMenu.findFirst({
    where: { id, userId },
    include: { items: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] } }
  });

  if (!menu) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader description="目的、時間、項目の内容や順番を変更できます。" title="練習メニューを編集" />
      <Card className="p-5 sm:p-7"><PracticeMenuForm menu={serializePracticeMenu(menu)} /></Card>
    </div>
  );
}
