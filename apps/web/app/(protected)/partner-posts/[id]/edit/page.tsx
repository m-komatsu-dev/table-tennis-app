import { notFound } from "next/navigation";
import { prisma } from "@table-tennis/db";
import { PartnerPostForm } from "@/components/partner-posts/partner-post-form";
import { Card, PageHeader } from "@/components/ui";
import { getRequiredUserId } from "@/lib/server-auth";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string | string[] }>;
};

export default async function EditPartnerPostPage({ params, searchParams }: PageProps) {
  const userId = await getRequiredUserId();
  const { id } = await params;
  const query = await searchParams;
  const post = await prisma.partnerPost.findFirst({
    where: { id, ownerId: userId }
  });

  if (!post) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader description="募集内容とステータスを編集できます。" title="募集を編集" />
      <Card className="p-5 sm:p-7">
        <PartnerPostForm error={singleParam(query.error)} post={post} />
      </Card>
    </div>
  );
}

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
