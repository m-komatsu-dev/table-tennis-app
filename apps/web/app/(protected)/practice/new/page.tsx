import { prisma } from "@table-tennis/db";
import { Card, PageHeader } from "@/components/ui";
import { PracticeForm } from "@/components/practice-form";
import { getRequiredUserId } from "@/lib/server-auth";

export default async function NewPracticePage({
  searchParams
}: {
  searchParams: Promise<{ practiceMenuId?: string | string[] }>;
}) {
  const userId = await getRequiredUserId();
  const menus = await prisma.practiceMenu.findMany({
    where: { userId },
    select: { id: true, title: true },
    orderBy: { title: "asc" }
  });
  const requestedId = (await searchParams).practiceMenuId;
  const initialPracticeMenuId = typeof requestedId === "string" && menus.some((menu) => menu.id === requestedId)
    ? requestedId
    : undefined;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="練習記録を作成" description="今日の練習内容を残します。" />
      <Card className="p-5 sm:p-7">
        <PracticeForm initialPracticeMenuId={initialPracticeMenuId} practiceMenus={menus} />
      </Card>
    </div>
  );
}
