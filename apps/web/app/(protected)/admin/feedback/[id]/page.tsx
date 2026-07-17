import Link from "next/link";
import { notFound } from "next/navigation";
import type { FeedbackStatus } from "@table-tennis/db";
import { updateFeedbackAction } from "@/app/(protected)/admin/feedback/actions";
import { Badge, Button, Card, ErrorMessage, Field, PageHeader, SuccessMessage, buttonStyles, inputClass } from "@/components/ui";
import { getAdminUserId } from "@/lib/admin";
import { getAdminFeedbackDetail } from "@/lib/admin-feedback";
import { feedbackCategoryLabels, feedbackPlatformLabels, feedbackStatusLabels } from "@/lib/feedback-options";
import { formatDateTime } from "@/lib/format";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string | string[]; success?: string | string[] }>;
};

const feedbackStatuses = Object.keys(feedbackStatusLabels) as FeedbackStatus[];

export default async function AdminFeedbackDetailPage({ params, searchParams }: PageProps) {
  const adminUserId = await getAdminUserId();

  if (!adminUserId) {
    notFound();
  }

  const { id } = await params;
  const query = await searchParams;
  const feedback = await getAdminFeedbackDetail(id).catch(() => null);

  if (!feedback) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        action={<Link className={buttonStyles({ variant: "secondary" })} href="/admin/feedback">フィードバック一覧へ戻る</Link>}
        description="本文と送信者情報を確認し、対応状況と管理者メモを更新します。"
        title="フィードバック詳細"
      />
      <div className="mb-5 space-y-3">
        <ErrorMessage message={singleParam(query.error)} />
        <SuccessMessage message={singleParam(query.success)} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-center gap-2">
              <FeedbackStatusBadge status={feedback.status} />
              <Badge>{feedbackCategoryLabels[feedback.category]}</Badge>
              <Badge tone="blue">{feedbackPlatformLabels[feedback.platform]}</Badge>
            </div>
            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              <DetailRow label="フィードバックID" value={feedback.id} />
              <DetailRow label="カテゴリ" value={feedbackCategoryLabels[feedback.category]} />
              <DetailRow label="件名" value={feedback.subject} />
              <DetailRow label="ステータス" value={feedbackStatusLabels[feedback.status]} />
              <DetailRow label="プラットフォーム" value={feedbackPlatformLabels[feedback.platform]} />
              <DetailRow label="送信元画面" value={feedback.sourcePath ?? "未設定"} />
              <DetailRow label="送信日時" value={formatDateTime(feedback.createdAt)} />
              <DetailRow label="更新日時" value={formatDateTime(feedback.updatedAt)} />
              <DetailRow label="送信者の表示名" value={feedback.user.name} />
              <DetailRow label="username" value={feedback.user.username ?? "未設定"} />
            </dl>
            <div className="mt-6 border-t border-slate-100 pt-6">
              <h2 className="text-sm font-bold text-slate-950">本文</h2>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{feedback.body}</p>
            </div>
          </Card>
        </div>

        <aside>
          <Card>
            <h2 className="text-base font-bold text-slate-950">管理者メモ・ステータス</h2>
            <form action={updateFeedbackAction} className="mt-4 space-y-4">
              <input name="id" type="hidden" value={feedback.id} />
              <Field label="ステータス">
                <select className={inputClass} defaultValue={feedback.status} name="status">
                  {feedbackStatuses.map((status) => (
                    <option key={status} value={status}>{feedbackStatusLabels[status]}</option>
                  ))}
                </select>
              </Field>
              <Field hint="一般ユーザーには表示されません。" label="管理者メモ">
                <textarea
                  className={`${inputClass} min-h-48 resize-y`}
                  defaultValue={feedback.adminNote ?? ""}
                  maxLength={2000}
                  name="adminNote"
                />
              </Field>
              <Button className="w-full" type="submit">
                更新する
              </Button>
            </form>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function FeedbackStatusBadge({ status }: { status: FeedbackStatus }) {
  return <Badge tone={status === "OPEN" ? "emerald" : status === "CLOSED" ? "red" : "blue"}>{feedbackStatusLabels[status]}</Badge>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium leading-6 text-slate-800">{value}</dd>
    </div>
  );
}

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
