import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@table-tennis/db";
import { PublicProfileLink } from "@/components/partner-posts/public-profile-link";
import { Badge, Button, Card, ErrorMessage, Field, PageHeader, SuccessMessage, buttonStyles, inputClass } from "@/components/ui";
import { closePartnerPostAction, createPartnerRequestAction, deletePartnerPostAction } from "@/lib/partner-post-actions";
import { partnerPostInclude, partnerPostStatusLabels, partnerPostTypeLabels, partnerRequestStatusLabels } from "@/lib/partner-posts";
import { blockUserAction, createReportAction, unblockUserAction } from "@/lib/safety-actions";
import { getBlockState, reportReasonOptions } from "@/lib/safety";
import { getRequiredUserId } from "@/lib/server-auth";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string | string[]; success?: string | string[] }>;
};

export default async function PartnerPostDetailPage({ params, searchParams }: PageProps) {
  const userId = await getRequiredUserId();
  const { id } = await params;
  const query = await searchParams;
  const post = await prisma.partnerPost.findUnique({
    where: { id },
    include: partnerPostInclude
  });

  if (!post) {
    notFound();
  }

  const isOwner = post.ownerId === userId;
  const ownRequest = post.requests.find((request) => request.requesterId === userId);
  const blockState = await getBlockState(userId, post.ownerId);
  const returnTo = `/partner-posts/${post.id}`;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        action={<Link className={buttonStyles({ variant: "secondary" })} href="/partner-posts">募集一覧へ戻る</Link>}
        description="募集内容を確認し、興味があれば参加希望を送れます。"
        title="募集詳細"
      />
      <div className="mb-5 space-y-3">
        <ErrorMessage message={singleParam(query.error)} />
        <SuccessMessage message={singleParam(query.success)} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={post.type === "PRACTICE" ? "emerald" : "blue"}>{partnerPostTypeLabels[post.type]}</Badge>
            <Badge tone={post.status === "OPEN" ? "emerald" : "red"}>{partnerPostStatusLabels[post.status]}</Badge>
            {isOwner ? <Badge>自分の募集</Badge> : null}
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">{post.title}</h1>
          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            <PartnerRow label="エリア" value={post.area} />
            <PartnerRow label="希望日時" value={post.preferredTime} />
            <PartnerRow label="レベル" value={post.level} />
            <PartnerRow label="目的" value={post.purpose} />
          </dl>
          <div className="mt-6 border-t border-slate-100 pt-6">
            <h2 className="text-sm font-bold text-slate-950">募集メッセージ</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">{post.message || "募集メッセージはありません。"}</p>
          </div>
        </Card>

        <aside className="space-y-4">
          <Card>
            <h2 className="text-base font-bold text-slate-950">投稿者</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <PartnerRow label="表示名" value={post.owner.name} />
            </dl>
            {blockState.blockedByMe ? (
              <p className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">このユーザーをブロックしています。</p>
            ) : null}
            <div className="mt-4">
              <PublicProfileLink publicProfileEnabled={post.owner.publicProfileEnabled} username={post.owner.username} />
            </div>
          </Card>

          {isOwner ? (
            <OwnerActions id={post.id} isClosed={post.status === "CLOSED"} />
          ) : (
            <>
              <RequestPanel
                isInteractionBlocked={blockState.isBlocked}
                postId={post.id}
                postStatus={post.status}
                requestStatus={ownRequest?.status ?? null}
              />
              <SafetyPanel
                blockedByMe={blockState.blockedByMe}
                ownerId={post.ownerId}
                postId={post.id}
                returnTo={returnTo}
              />
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function OwnerActions({ id, isClosed }: { id: string; isClosed: boolean }) {
  return (
    <Card className="space-y-3">
      <h2 className="text-base font-bold text-slate-950">投稿者メニュー</h2>
      <Link className={buttonStyles({ className: "w-full" })} href={`/partner-posts/${id}/edit`}>
        編集
      </Link>
      <form action={closePartnerPostAction}>
        <input name="id" type="hidden" value={id} />
        <Button className="w-full" disabled={isClosed} type="submit" variant="secondary">
          {isClosed ? "締め切り済み" : "締め切る"}
        </Button>
      </form>
      <Link className={buttonStyles({ variant: "secondary", className: "w-full" })} href={`/partner-posts/${id}/requests`}>
        参加希望一覧を見る
      </Link>
      <form action={deletePartnerPostAction}>
        <input name="id" type="hidden" value={id} />
        <Button className="w-full" type="submit" variant="danger">
          削除
        </Button>
      </form>
      <p className="text-xs leading-5 text-slate-500">削除すると届いた参加希望も削除されます。</p>
    </Card>
  );
}

function RequestPanel({
  isInteractionBlocked,
  postId,
  postStatus,
  requestStatus
}: {
  isInteractionBlocked: boolean;
  postId: string;
  postStatus: string;
  requestStatus: string | null;
}) {
  if (requestStatus) {
    return (
      <Card>
        <h2 className="text-base font-bold text-slate-950">参加希望</h2>
        <div className="mt-3">
          <Badge tone="blue">送信済み: {partnerRequestStatusLabels[requestStatus as keyof typeof partnerRequestStatusLabels]}</Badge>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">投稿者が参加希望を確認できます。チャット機能はありません。</p>
      </Card>
    );
  }

  if (postStatus !== "OPEN") {
    return (
      <Card>
        <h2 className="text-base font-bold text-slate-950">参加希望</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">この募集は締め切られているため、参加希望を送れません。</p>
      </Card>
    );
  }

  if (isInteractionBlocked) {
    return (
      <Card>
        <h2 className="text-base font-bold text-slate-950">参加希望</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">このユーザーとは現在やり取りできません。</p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-base font-bold text-slate-950">参加希望を送る</h2>
      <form action={createPartnerRequestAction} className="mt-4 space-y-4">
        <input name="postId" type="hidden" value={postId} />
        <Field hint="住所・電話番号・メールアドレスなどの個人情報は書かないでください。" label="メッセージ">
          <textarea
            className={`${inputClass} min-h-32 resize-y`}
            maxLength={300}
            name="message"
            placeholder="こんにちは。バックハンド練習をしたいので参加希望です。"
            rows={5}
          />
        </Field>
        <Button className="w-full" type="submit">
          参加希望を送る
        </Button>
      </form>
    </Card>
  );
}

function SafetyPanel({
  blockedByMe,
  ownerId,
  postId,
  returnTo
}: {
  blockedByMe: boolean;
  ownerId: string;
  postId: string;
  returnTo: string;
}) {
  return (
    <Card className="space-y-5">
      <h2 className="text-base font-bold text-slate-950">安全メニュー</h2>
      <ReportForm label="この募集を通報" returnTo={returnTo} targetPostId={postId} targetType="PARTNER_POST" />
      <ReportForm label="このユーザーを通報" returnTo={returnTo} targetType="USER" targetUserId={ownerId} />
      {blockedByMe ? (
        <form action={unblockUserAction}>
          <input name="blockedUserId" type="hidden" value={ownerId} />
          <input name="returnTo" type="hidden" value={returnTo} />
          <Button className="w-full" type="submit" variant="secondary">
            ブロック解除
          </Button>
        </form>
      ) : (
        <form action={blockUserAction}>
          <input name="blockedUserId" type="hidden" value={ownerId} />
          <input name="returnTo" type="hidden" value={returnTo} />
          <Button className="w-full" type="submit" variant="danger">
            このユーザーをブロック
          </Button>
        </form>
      )}
    </Card>
  );
}

function ReportForm({
  label,
  returnTo,
  targetPostId,
  targetType,
  targetUserId
}: {
  label: string;
  returnTo: string;
  targetPostId?: string;
  targetType: "USER" | "PARTNER_POST";
  targetUserId?: string;
}) {
  return (
    <form action={createReportAction} className="space-y-3 border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
      <input name="targetType" type="hidden" value={targetType} />
      <input name="returnTo" type="hidden" value={returnTo} />
      {targetUserId ? <input name="targetUserId" type="hidden" value={targetUserId} /> : null}
      {targetPostId ? <input name="targetPostId" type="hidden" value={targetPostId} /> : null}
      <p className="text-sm font-bold text-slate-800">{label}</p>
      <Field label="理由">
        <select className={inputClass} name="reason" defaultValue="INAPPROPRIATE">
          {reportReasonOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
      <Field hint="緊急の場合は、アプリ外の適切な窓口にも相談してください。" label="詳細">
        <textarea className={`${inputClass} min-h-24 resize-y`} maxLength={500} name="details" rows={3} />
      </Field>
      <Button className="w-full" type="submit" variant="secondary">
        {label}
      </Button>
    </form>
  );
}

function PartnerRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium leading-6 text-slate-800">{value || "未設定"}</dd>
    </div>
  );
}

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
