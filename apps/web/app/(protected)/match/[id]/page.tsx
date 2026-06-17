import { notFound } from "next/navigation";
import { prisma } from "@table-tennis/db";
import { Card, PageHeader } from "@/components/ui";
import { MatchForm } from "@/components/match-form";
import { serializeMatch } from "@/lib/serialize";
import { getRequiredUserId } from "@/lib/server-auth";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function MatchDetailPage({ params }: PageProps) {
  const userId = await getRequiredUserId();
  const { id } = await params;
  const record = await prisma.matchRecord.findFirst({
    where: { id, userId }
  });

  if (!record) {
    notFound();
  }

  return (
    <>
      <PageHeader title="試合記録の詳細" description="内容を編集できます。" />
      <Card>
        <MatchForm match={serializeMatch(record)} />
      </Card>
    </>
  );
}
