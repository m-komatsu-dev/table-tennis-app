import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReportStatus, ReportTargetType } from "@table-tennis/db";
import { Badge, Button, Card, EmptyState, ErrorMessage, Field, PageHeader, buttonStyles, inputClass } from "@/components/ui";
import { getAdminUserId } from "@/lib/admin";
import {
  getAdminReportList,
  reportStatusLabels,
  reportTargetTypeLabels,
  type ReportFilters
} from "@/lib/admin-reports";
import { formatDateTime } from "@/lib/format";
import { reportReasonLabels } from "@/lib/safety";

type PageProps = {
  searchParams: Promise<{ status?: string | string[]; targetType?: string | string[] }>;
};

const reportStatuses = Object.keys(reportStatusLabels) as ReportStatus[];
const reportTargetTypes = Object.keys(reportTargetTypeLabels) as ReportTargetType[];

export default async function AdminReportsPage({ searchParams }: PageProps) {
  const adminUserId = await getAdminUserId();

  if (!adminUserId) {
    notFound();
  }

  const query = await searchParams;
  const filters = normalizeFilters(query);

  try {
    const { reports, totalCount } = await getAdminReportList(filters);
    const hasFilters = Boolean(filters.status || filters.targetType);

    return (
      <>
        <PageHeader
          description="通報・ブロックLiteで保存された通報を確認し、対応状況を管理します。"
          title="通報一覧"
        />
        <Card className="mb-6">
          <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto]" method="get">
            <Field label="ステータスフィルター">
              <select className={inputClass} defaultValue={filters.status ?? ""} name="status">
                <option value="">すべて</option>
                {reportStatuses.map((status) => (
                  <option key={status} value={status}>
                    {reportStatusLabels[status]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="通報対象タイプフィルター">
              <select className={inputClass} defaultValue={filters.targetType ?? ""} name="targetType">
                <option value="">すべて</option>
                {reportTargetTypes.map((targetType) => (
                  <option key={targetType} value={targetType}>
                    {reportTargetTypeLabels[targetType]}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex items-end gap-2">
              <Button className="w-full md:w-auto" type="submit">
                絞り込む
              </Button>
              <Link className={buttonStyles({ variant: "secondary", className: "w-full md:w-auto" })} href="/admin/reports">
                解除
              </Link>
            </div>
          </form>
        </Card>

        {reports.length === 0 ? (
          <EmptyState>{totalCount === 0 && !hasFilters ? "現在、通報はありません。" : "条件に一致する通報はありません。"}</EmptyState>
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">通報日時</th>
                    <th className="px-5 py-3">通報理由</th>
                    <th className="px-5 py-3">対象タイプ</th>
                    <th className="px-5 py-3">ステータス</th>
                    <th className="px-5 py-3">通報者</th>
                    <th className="px-5 py-3">対象ユーザー</th>
                    <th className="px-5 py-3">対象募集</th>
                    <th className="px-5 py-3">詳細</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">{formatDateTime(report.createdAt)}</td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-900">{reportReasonLabels[report.reason]}</span>
                      </td>
                      <td className="px-5 py-4">
                        <Badge>{reportTargetTypeLabels[report.targetType]}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <ReportStatusBadge status={report.status} />
                      </td>
                      <td className="px-5 py-4 text-slate-700">{report.reporter.name}</td>
                      <td className="px-5 py-4 text-slate-700">{report.targetUser?.name ?? "未設定"}</td>
                      <td className="max-w-56 truncate px-5 py-4 text-slate-700">{report.targetPost?.title ?? "未設定"}</td>
                      <td className="px-5 py-4">
                        <Link className="font-semibold text-emerald-700 hover:underline" href={`/admin/reports/${report.id}`}>
                          詳細を見る
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-100 lg:hidden">
              {reports.map((report) => (
                <div className="space-y-3 p-5" key={report.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-950">{reportReasonLabels[report.reason]}</p>
                    <ReportStatusBadge status={report.status} />
                  </div>
                  <dl className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                    <ReportRow label="通報日時" value={formatDateTime(report.createdAt)} />
                    <ReportRow label="通報対象" value={reportTargetTypeLabels[report.targetType]} />
                    <ReportRow label="通報者" value={report.reporter.name} />
                    <ReportRow label="対象ユーザー" value={report.targetUser?.name ?? "未設定"} />
                    <ReportRow label="対象募集" value={report.targetPost?.title ?? "未設定"} />
                  </dl>
                  <Link className={buttonStyles({ variant: "secondary", className: "w-full" })} href={`/admin/reports/${report.id}`}>
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
        <PageHeader title="通報一覧" />
        <ErrorMessage message="通報一覧を読み込めませんでした。" />
      </>
    );
  }
}

function normalizeFilters(query: Awaited<PageProps["searchParams"]>): ReportFilters {
  const status = singleParam(query.status);
  const targetType = singleParam(query.targetType);

  return {
    status: reportStatuses.includes(status as ReportStatus) ? (status as ReportStatus) : undefined,
    targetType: reportTargetTypes.includes(targetType as ReportTargetType) ? (targetType as ReportTargetType) : undefined
  };
}

function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return <Badge tone={status === "OPEN" ? "emerald" : status === "DISMISSED" ? "red" : "blue"}>{reportStatusLabels[status]}</Badge>;
}

function ReportRow({ label, value }: { label: string; value: string }) {
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
