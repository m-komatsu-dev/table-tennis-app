import Link from "next/link";
import type { PartnerPostStatus, PartnerPostType } from "@table-tennis/db";
import { prisma } from "@table-tennis/db";
import { Badge, Card, EmptyState, ErrorMessage, PageHeader, PrimaryLink, SuccessMessage, buttonStyles } from "@/components/ui";
import { partnerPostInclude, partnerPostStatusLabels, partnerPostTypeLabels } from "@/lib/partner-posts";
import { getRequiredUserId } from "@/lib/server-auth";
import { blockedPartnerPostWhere } from "@/lib/safety";

type PageProps = {
  searchParams: Promise<{ filter?: string | string[]; error?: string | string[]; success?: string | string[] }>;
};

const filterOptions = [
  { label: "すべて", value: "all" },
  { label: "練習相手", value: "practice" },
  { label: "試合相手", value: "match" },
  { label: "募集中のみ", value: "open" }
] as const;

export default async function PartnerPostsPage({ searchParams }: PageProps) {
  const userId = await getRequiredUserId();
  const params = await searchParams;
  const filter = parseFilter(params.filter);
  const posts = await prisma.partnerPost.findMany({
    where: {
      AND: [buildFilterWhere(filter), blockedPartnerPostWhere(userId)]
    },
    include: partnerPostInclude,
    orderBy: { createdAt: "desc" }
  });

  return (
    <>
      <PageHeader
        action={<PrimaryLink href="/partner-posts/new">募集を作成する</PrimaryLink>}
        description="練習相手・試合相手の募集を確認できます。チャットなしで、まずは参加希望を送るところまでです。"
        title="募集一覧"
      />
      <div className="mb-5 space-y-3">
        <ErrorMessage message={singleParam(params.error)} />
        <SuccessMessage message={singleParam(params.success)} />
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {filterOptions.map((option) => {
          const active = filter === option.value;
          const href = option.value === "all" ? "/partner-posts" : `/partner-posts?filter=${option.value}`;

          return (
            <Link
              className={buttonStyles({
                variant: active ? "primary" : "secondary",
                className: "min-h-10 px-3"
              })}
              href={href}
              key={option.value}
            >
              {option.label}
            </Link>
          );
        })}
      </div>

      {posts.length === 0 ? (
        <EmptyState action={<PrimaryLink href="/partner-posts/new">募集を作成する</PrimaryLink>}>
          <p className="font-semibold text-slate-800">現在、募集はありません。</p>
          <p className="mt-1">練習相手や試合相手を募集してみましょう。</p>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => {
            const ownRequest = post.requests.find((request) => request.requesterId === userId);

            return (
              <Link className="group" href={`/partner-posts/${post.id}`} key={post.id}>
                <Card className="flex min-h-80 flex-col transition duration-200 group-hover:-translate-y-1 group-hover:border-emerald-300 group-hover:shadow-lg group-hover:shadow-emerald-900/[0.06]">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={post.type === "PRACTICE" ? "emerald" : "blue"}>{partnerPostTypeLabels[post.type]}</Badge>
                    <Badge tone={post.status === "OPEN" ? "emerald" : "red"}>{partnerPostStatusLabels[post.status]}</Badge>
                    {post.ownerId === userId ? <Badge>自分の募集</Badge> : null}
                    {ownRequest ? <Badge tone="blue">参加希望済み</Badge> : null}
                  </div>
                  <h2 className="mt-4 text-lg font-bold leading-7 text-slate-950">{post.title}</h2>
                  <dl className="mt-4 grid gap-3 text-sm">
                    <PartnerRow label="エリア" value={post.area} />
                    <PartnerRow label="希望日時" value={post.preferredTime} />
                    <PartnerRow label="レベル" value={post.level} />
                    <PartnerRow label="目的" value={post.purpose} />
                    <PartnerRow label="投稿者" value={post.owner.name} />
                  </dl>
                  <span className="mt-auto border-t border-slate-100 pt-4 text-sm font-semibold text-emerald-700 group-hover:text-emerald-800">
                    詳細を見る →
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

function PartnerRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-0.5 line-clamp-2 font-medium text-slate-800">{value || "未設定"}</dd>
    </div>
  );
}

function parseFilter(value: string | string[] | undefined) {
  const filter = Array.isArray(value) ? value[0] : value;

  if (filter === "practice" || filter === "match" || filter === "open") {
    return filter;
  }

  return "all";
}

function buildFilterWhere(filter: ReturnType<typeof parseFilter>) {
  if (filter === "practice") {
    return { type: "PRACTICE" as PartnerPostType };
  }

  if (filter === "match") {
    return { type: "MATCH" as PartnerPostType };
  }

  if (filter === "open") {
    return { status: "OPEN" as PartnerPostStatus };
  }

  return {};
}

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
