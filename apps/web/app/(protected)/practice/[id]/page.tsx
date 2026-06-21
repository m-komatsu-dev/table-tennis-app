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
  const [practice, menus] = await Promise.all([
    prisma.practiceLog.findFirst({
      where: { id, userId },
      include: { equipment: true, practiceMenu: { select: { id: true, title: true } } }
    }),
    prisma.practiceMenu.findMany({
      where: { userId },
      select: { id: true, title: true },
      orderBy: { title: "asc" }
    })
  ]);

  if (!practice) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="練習記録の詳細" description="内容を編集できます。" />
      {practice.practiceMenu ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          使用メニュー：<Link className="font-bold underline decoration-emerald-300 underline-offset-4 hover:text-emerald-700" href={`/practice-menus/${practice.practiceMenu.id}`}>{practice.practiceMenu.title}</Link>
        </div>
      ) : null}
      <Card className="p-5 sm:p-7">
        <PracticeForm practice={serializePractice(practice)} practiceMenus={menus} />
      </Card>
    </div>
  );
}
import Link from "next/link";
