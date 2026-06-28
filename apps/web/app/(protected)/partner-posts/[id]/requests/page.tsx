import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@table-tennis/db";
import { PublicProfileLink } from "@/components/partner-posts/public-profile-link";
import { Badge, Button, Card, EmptyState, ErrorMessage, PageHeader, SuccessMessage, buttonStyles } from "@/components/ui";
import { updatePartnerRequestAction } from "@/lib/partner-post-actions";
import { partnerRequestInclude, partnerRequestStatusLabels } from "@/lib/partner-posts";
import { formatDate } from "@/lib/format";
import { getRequiredUserId } from "@/lib/server-auth";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string | string[]; success?: string | string[] }>;
};

export default async function PartnerRequestsPage({ params, searchParams }: PageProps) {
  const userId = await getRequiredUserId();
  const { id } = await params;
  const query = await searchParams;
  const post = await prisma.partnerPost.findFirst({
    where: { id, ownerId: userId },
    select: { id: true, title: true }
  });

  if (!post) {
    notFound();
  }

  const requests = await prisma.partnerRequest.findMany({
    where: { postId: post.id },
    include: partnerRequestInclude,
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        action={<Link className={buttonStyles({ variant: "secondary" })} href={`/partner-posts/${post.id}`}>募集詳細へ戻る</Link>}
        description={post.title}
        title="参加希望一覧"
      />
      <div className="mb-5 space-y-3">
        <ErrorMessage message={singleParam(query.error)} />
        <SuccessMessage message={singleParam(query.success)} />
      </div>
      {requests.length === 0 ? (
        <EmptyState>
          <p className="font-semibold text-slate-800">まだ参加希望はありません。</p>
          <p className="mt-1">募集内容を分かりやすく書くと、反応が届きやすくなります。</p>
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-950">{request.requester.name}</h2>
                    <Badge tone={request.status === "ACCEPTED" ? "emerald" : request.status === "DECLINED" ? "red" : "blue"}>
                      {partnerRequestStatusLabels[request.status]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">送信日時: {formatDate(request.createdAt.toISOString())}</p>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{request.message || "メッセージはありません。"}</p>
                  <div className="mt-4">
                    <PublicProfileLink
                      publicProfileEnabled={request.requester.publicProfileEnabled}
                      username={request.requester.username}
                    />
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                  <form action={updatePartnerRequestAction}>
                    <input name="id" type="hidden" value={request.id} />
                    <input name="postId" type="hidden" value={post.id} />
                    <input name="status" type="hidden" value="ACCEPTED" />
                    <Button className="w-full sm:min-w-28" type="submit" variant="secondary">
                      承認
                    </Button>
                  </form>
                  <form action={updatePartnerRequestAction}>
                    <input name="id" type="hidden" value={request.id} />
                    <input name="postId" type="hidden" value={post.id} />
                    <input name="status" type="hidden" value="DECLINED" />
                    <Button className="w-full sm:min-w-28" type="submit" variant="secondary">
                      見送り
                    </Button>
                  </form>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
