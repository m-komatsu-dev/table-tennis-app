import Link from "next/link";
import { prisma } from "@table-tennis/db";
import { Badge, Card, EmptyState, PageHeader, buttonStyles } from "@/components/ui";
import { feedbackCategoryLabels, feedbackStatusLabels } from "@/lib/feedback-options";
import { formatDateTime } from "@/lib/format";
import { getRequiredUserId } from "@/lib/server-auth";

export default async function FeedbackHistoryPage() {
  const userId = await getRequiredUserId();
  const feedbacks = await prisma.feedback.findMany({
    where: { userId },
    select: {
      id: true,
      category: true,
      subject: true,
      status: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <>
      <PageHeader
        action={<Link className={buttonStyles({ variant: "secondary" })} href="/feedback">フィードバックへ戻る</Link>}
        description="送信したフィードバックのカテゴリ、件名、送信日時、現在のステータスを確認できます。"
        title="自分の送信履歴"
      />
      {feedbacks.length === 0 ? (
        <EmptyState>まだフィードバックは送信していません。</EmptyState>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">カテゴリ</th>
                  <th className="px-5 py-3">件名</th>
                  <th className="px-5 py-3">送信日時</th>
                  <th className="px-5 py-3">ステータス</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {feedbacks.map((feedback) => (
                  <tr key={feedback.id}>
                    <td className="px-5 py-4"><Badge>{feedbackCategoryLabels[feedback.category]}</Badge></td>
                    <td className="px-5 py-4 font-semibold text-slate-900">{feedback.subject}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-700">{formatDateTime(feedback.createdAt)}</td>
                    <td className="px-5 py-4"><FeedbackStatusBadge status={feedback.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-slate-100 md:hidden">
            {feedbacks.map((feedback) => (
              <div className="space-y-3 p-5" key={feedback.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{feedbackCategoryLabels[feedback.category]}</Badge>
                  <FeedbackStatusBadge status={feedback.status} />
                </div>
                <p className="font-bold text-slate-950">{feedback.subject}</p>
                <p className="text-sm text-slate-600">{formatDateTime(feedback.createdAt)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}

function FeedbackStatusBadge({ status }: { status: keyof typeof feedbackStatusLabels }) {
  return <Badge tone={status === "OPEN" ? "emerald" : status === "CLOSED" ? "red" : "blue"}>{feedbackStatusLabels[status]}</Badge>;
}
