import Link from "next/link";
import { notFound } from "next/navigation";
import type { FeedbackCategory, FeedbackPlatform, FeedbackStatus } from "@table-tennis/db";
import { Badge, Button, Card, EmptyState, ErrorMessage, Field, PageHeader, buttonStyles, inputClass } from "@/components/ui";
import { getAdminUserId } from "@/lib/admin";
import { getAdminFeedbackList, type FeedbackFilters } from "@/lib/admin-feedback";
import { feedbackCategoryLabels, feedbackPlatformLabels, feedbackStatusLabels } from "@/lib/feedback-options";
import { formatDateTime } from "@/lib/format";

type PageProps = {
  searchParams: Promise<{
    status?: string | string[];
    category?: string | string[];
    platform?: string | string[];
    error?: string | string[];
  }>;
};

const feedbackStatuses = Object.keys(feedbackStatusLabels) as FeedbackStatus[];
const feedbackCategories = Object.keys(feedbackCategoryLabels) as FeedbackCategory[];
const feedbackPlatforms = Object.keys(feedbackPlatformLabels) as FeedbackPlatform[];

export default async function AdminFeedbackPage({ searchParams }: PageProps) {
  const adminUserId = await getAdminUserId();

  if (!adminUserId) {
    notFound();
  }

  const query = await searchParams;
  const filters = normalizeFilters(query);

  try {
    const { feedbacks, totalCount } = await getAdminFeedbackList(filters);
    const hasFilters = Boolean(filters.status || filters.category || filters.platform);

    return (
      <>
        <PageHeader
          description="βテスト利用者から届いたフィードバックを確認し、対応状況と管理者メモを管理します。"
          title="フィードバック一覧"
        />
        <div className="mb-5">
          <ErrorMessage message={singleParam(query.error)} />
        </div>
        <Card className="mb-6">
          <form className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]" method="get">
            <Field label="ステータス">
              <select className={inputClass} defaultValue={filters.status ?? ""} name="status">
                <option value="">すべて</option>
                {feedbackStatuses.map((status) => (
                  <option key={status} value={status}>{feedbackStatusLabels[status]}</option>
                ))}
              </select>
            </Field>
            <Field label="カテゴリ">
              <select className={inputClass} defaultValue={filters.category ?? ""} name="category">
                <option value="">すべて</option>
                {feedbackCategories.map((category) => (
                  <option key={category} value={category}>{feedbackCategoryLabels[category]}</option>
                ))}
              </select>
            </Field>
            <Field label="プラットフォーム">
              <select className={inputClass} defaultValue={filters.platform ?? ""} name="platform">
                <option value="">すべて</option>
                {feedbackPlatforms.map((platform) => (
                  <option key={platform} value={platform}>{feedbackPlatformLabels[platform]}</option>
                ))}
              </select>
            </Field>
            <div className="flex items-end gap-2">
              <Button className="w-full lg:w-auto" type="submit">絞り込む</Button>
              <Link className={buttonStyles({ variant: "secondary", className: "w-full lg:w-auto" })} href="/admin/feedback">解除</Link>
            </div>
          </form>
        </Card>

        {feedbacks.length === 0 ? (
          <EmptyState>{totalCount === 0 && !hasFilters ? "現在、フィードバックはありません。" : "条件に一致するフィードバックはありません。"}</EmptyState>
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="hidden overflow-x-auto xl:block">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">送信日時</th>
                    <th className="px-5 py-3">件名</th>
                    <th className="px-5 py-3">カテゴリ</th>
                    <th className="px-5 py-3">ステータス</th>
                    <th className="px-5 py-3">送信者</th>
                    <th className="px-5 py-3">プラットフォーム</th>
                    <th className="px-5 py-3">送信元画面</th>
                    <th className="px-5 py-3">詳細</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {feedbacks.map((feedback) => (
                    <tr key={feedback.id}>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">{formatDateTime(feedback.createdAt)}</td>
                      <td className="max-w-64 truncate px-5 py-4 font-semibold text-slate-900">{feedback.subject}</td>
                      <td className="px-5 py-4"><Badge>{feedbackCategoryLabels[feedback.category]}</Badge></td>
                      <td className="px-5 py-4"><FeedbackStatusBadge status={feedback.status} /></td>
                      <td className="px-5 py-4 text-slate-700">{feedback.user.name}</td>
                      <td className="px-5 py-4 text-slate-700">{feedbackPlatformLabels[feedback.platform]}</td>
                      <td className="max-w-44 truncate px-5 py-4 text-slate-700">{feedback.sourcePath ?? "未設定"}</td>
                      <td className="px-5 py-4">
                        <Link className="font-semibold text-emerald-700 hover:underline" href={`/admin/feedback/${feedback.id}`}>
                          詳細を見る
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-100 xl:hidden">
              {feedbacks.map((feedback) => (
                <div className="space-y-3 p-5" key={feedback.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{feedbackCategoryLabels[feedback.category]}</Badge>
                    <FeedbackStatusBadge status={feedback.status} />
                    <Badge tone="blue">{feedbackPlatformLabels[feedback.platform]}</Badge>
                  </div>
                  <p className="font-bold text-slate-950">{feedback.subject}</p>
                  <dl className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                    <Row label="送信日時" value={formatDateTime(feedback.createdAt)} />
                    <Row label="送信者" value={feedback.user.name} />
                    <Row label="送信元画面" value={feedback.sourcePath ?? "未設定"} />
                  </dl>
                  <Link className={buttonStyles({ variant: "secondary", className: "w-full" })} href={`/admin/feedback/${feedback.id}`}>
                    詳細を見る
                  </Link>
                </div>
              ))}
            </div>
          </Card>
        )}
      </>
    );
  } catch {
    return (
      <>
        <PageHeader title="フィードバック一覧" />
        <ErrorMessage message="フィードバック一覧を読み込めませんでした。" />
      </>
    );
  }
}

function normalizeFilters(query: Awaited<PageProps["searchParams"]>): FeedbackFilters {
  const status = singleParam(query.status);
  const category = singleParam(query.category);
  const platform = singleParam(query.platform);

  return {
    status: feedbackStatuses.includes(status as FeedbackStatus) ? (status as FeedbackStatus) : undefined,
    category: feedbackCategories.includes(category as FeedbackCategory) ? (category as FeedbackCategory) : undefined,
    platform: feedbackPlatforms.includes(platform as FeedbackPlatform) ? (platform as FeedbackPlatform) : undefined
  };
}

function FeedbackStatusBadge({ status }: { status: FeedbackStatus }) {
  return <Badge tone={status === "OPEN" ? "emerald" : status === "CLOSED" ? "red" : "blue"}>{feedbackStatusLabels[status]}</Badge>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
