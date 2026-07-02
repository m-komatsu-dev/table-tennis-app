import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReportStatus } from "@table-tennis/db";
import { updateReportStatusAction } from "@/app/(protected)/admin/reports/actions";
import { Badge, Button, Card, ErrorMessage, Field, PageHeader, SuccessMessage, buttonStyles, inputClass } from "@/components/ui";
import { getAdminUserId } from "@/lib/admin";
import { getAdminReportDetail, reportStatusLabels, reportTargetTypeLabels } from "@/lib/admin-reports";
import { formatDateTime } from "@/lib/format";
import { reportReasonLabels } from "@/lib/safety";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string | string[]; success?: string | string[] }>;
};

const reportStatuses = Object.keys(reportStatusLabels) as ReportStatus[];

export default async function AdminReportDetailPage({ params, searchParams }: PageProps) {
  const adminUserId = await getAdminUserId();

  if (!adminUserId) {
    notFound();
  }

  const { id } = await params;
  const query = await searchParams;

  let report: Awaited<ReturnType<typeof getAdminReportDetail>>;

  try {
    report = await getAdminReportDetail(id);
  } catch {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader action={<Link className={buttonStyles({ variant: "secondary" })} href="/admin/reports">通報一覧へ戻る</Link>} title="通報詳細" />
        <ErrorMessage message="通報詳細を読み込めませんでした。" />
      </div>
    );
  }

  if (!report) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        action={<Link className={buttonStyles({ variant: "secondary" })} href="/admin/reports">通報一覧へ戻る</Link>}
        description="通報内容と対象情報を確認し、対応状況を更新します。"
        title="通報詳細"
      />
      <div className="mb-5 space-y-3">
        <ErrorMessage message={singleParam(query.error)} />
        <SuccessMessage message={singleParam(query.success)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-center gap-2">
              <ReportStatusBadge status={report.status} />
              <Badge>{reportTargetTypeLabels[report.targetType]}</Badge>
            </div>
            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              <DetailRow label="通報ID" value={report.id} />
              <DetailRow label="通報日時" value={formatDateTime(report.createdAt)} />
              <DetailRow label="通報者の表示名" value={report.reporter.name} />
              <DetailRow label="通報対象タイプ" value={reportTargetTypeLabels[report.targetType]} />
              <DetailRow label="通報理由" value={reportReasonLabels[report.reason]} />
              <DetailRow label="ステータス" value={reportStatusLabels[report.status]} />
            </dl>
            <div className="mt-6 border-t border-slate-100 pt-6">
              <h2 className="text-sm font-bold text-slate-950">詳細</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">{report.details || "詳細はありません。"}</p>
            </div>
          </Card>

            <Card>
              <h2 className="text-base font-bold text-slate-950">対象ユーザー情報</h2>
              {report.targetUser ? (
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <DetailRow label="表示名" value={report.targetUser.name} />
                  <DetailRow label="username" value={report.targetUser.username ?? "未設定"} />
                  <DetailRow label="作成日時" value={formatDateTime(report.targetUser.createdAt)} />
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">公開プロフィール</dt>
                    <dd className="mt-1 text-sm font-medium text-slate-800">
                      {report.targetUser.publicProfileEnabled && report.targetUser.username ? (
                        <Link className="font-semibold text-emerald-700 hover:underline" href={`/u/${report.targetUser.username}`}>
                          公開プロフィールを見る
                        </Link>
                      ) : (
                        "非公開"
                      )}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-3 text-sm text-slate-600">対象ユーザー情報はありません。</p>
              )}
            </Card>

            <Card>
              <h2 className="text-base font-bold text-slate-950">対象募集情報</h2>
              {report.targetPost ? (
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <DetailRow label="募集タイトル" value={report.targetPost.title} />
                  <DetailRow label="作成日時" value={formatDateTime(report.targetPost.createdAt)} />
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold text-slate-500">募集メッセージ</dt>
                    <dd className="mt-1 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-800">
                      {report.targetPost.message || "募集メッセージはありません。"}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-3 text-sm text-slate-600">対象募集情報はありません。</p>
              )}
            </Card>

            <Card>
              <h2 className="text-base font-bold text-slate-950">対象参加希望情報</h2>
              {report.targetRequest ? (
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <DetailRow label="表示名" value={report.targetRequest.requester.name} />
                  <DetailRow label="username" value={report.targetRequest.requester.username ?? "未設定"} />
                  <DetailRow label="作成日時" value={formatDateTime(report.targetRequest.createdAt)} />
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold text-slate-500">参加希望メッセージ</dt>
                    <dd className="mt-1 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-800">
                      {report.targetRequest.message || "参加希望メッセージはありません。"}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-3 text-sm text-slate-600">対象参加希望情報はありません。</p>
              )}
            </Card>
          </div>

        <aside>
          <Card>
            <h2 className="text-base font-bold text-slate-950">ステータス変更</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              このステータスは通報への判断を記録するものです。対象の表示制御は自動では行われません。
            </p>
            <form action={updateReportStatusAction} className="mt-4 space-y-4">
              <input name="id" type="hidden" value={report.id} />
              <Field label="変更先">
                <select className={inputClass} defaultValue={report.status} name="status">
                  {reportStatuses.map((status) => (
                    <option key={status} value={status}>
                      {reportStatusLabels[status]}
                    </option>
                  ))}
                </select>
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

function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return <Badge tone={status === "OPEN" ? "emerald" : status === "DISMISSED" ? "red" : "blue"}>{reportStatusLabels[status]}</Badge>;
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
