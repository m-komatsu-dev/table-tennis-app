import Link from "next/link";
import { prisma } from "@table-tennis/db";
import { PracticeMenuDeleteButton } from "@/components/practice-menu-delete-button";
import { Badge, EmptyState, PageHeader, PrimaryLink, buttonStyles } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { getRequiredUserId } from "@/lib/server-auth";

export default async function PracticeMenusPage() {
  const userId = await getRequiredUserId();
  const menus = await prisma.practiceMenu.findMany({
    where: { userId },
    include: { _count: { select: { items: true } } },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <>
      <PageHeader
        action={<PrimaryLink href="/practice-menus/new">練習メニューを作成</PrimaryLink>}
        description="繰り返し使う練習の流れをテンプレートとして保存・管理します。"
        title="練習メニュー"
      />
      {menus.length === 0 ? (
        <EmptyState action={<PrimaryLink href="/practice-menus/new">練習メニューを作成</PrimaryLink>}>
          <p className="font-semibold text-slate-800">まだ練習メニューがありません。</p>
          <p className="mt-1">よく使う練習メニューを作成しましょう。</p>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {menus.map((menu) => (
            <article className="flex min-h-72 flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.04] transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-900/[0.05]" key={menu.id}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="wrap-break-words text-lg font-bold text-slate-950">{menu.title}</h2>
                <Badge tone="emerald">{menu.totalMinutes ? `${menu.totalMinutes}分` : "時間未設定"}</Badge>
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">目的</p>
              <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-600">{menu.goal || "目的は未設定です"}</p>
              <dl className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                <div><dt className="text-xs text-slate-500">項目数</dt><dd className="mt-1 font-bold text-slate-900">{menu._count.items}件</dd></div>
                <div><dt className="text-xs text-slate-500">作成日</dt><dd className="mt-1 font-bold text-slate-900">{formatDate(menu.createdAt)}</dd></div>
              </dl>
              <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <Link className={buttonStyles({ className: "min-h-9 flex-1 px-3" })} href={`/practice-menus/${menu.id}`}>詳細</Link>
                <Link className={buttonStyles({ variant: "secondary", className: "min-h-9 flex-1 px-3" })} href={`/practice-menus/${menu.id}/edit`}>編集</Link>
                <PracticeMenuDeleteButton compact id={menu.id} />
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
