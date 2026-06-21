import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@table-tennis/db";
import { PracticeMenuDeleteButton } from "@/components/practice-menu-delete-button";
import { Badge, Card, PageHeader, buttonStyles } from "@/components/ui";
import { practiceMenuCategoryLabels } from "@/lib/practice-menu";
import { getRequiredUserId } from "@/lib/server-auth";

type PageProps = { params: Promise<{ id: string }> };

export default async function PracticeMenuDetailPage({ params }: PageProps) {
  const userId = await getRequiredUserId();
  const { id } = await params;
  const menu = await prisma.practiceMenu.findFirst({
    where: { id, userId },
    include: { items: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] } }
  });

  if (!menu) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        action={<Link className={buttonStyles({ variant: "secondary" })} href={`/practice-menus/${menu.id}/edit`}>編集</Link>}
        description="テンプレートの目的と練習の流れを確認できます。"
        title={menu.title}
      />
      <Card className="p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="emerald">{menu.totalMinutes ? `合計 ${menu.totalMinutes}分` : "合計時間未設定"}</Badge>
          <Badge>{menu.items.length}項目</Badge>
        </div>
        <dl className="mt-6 grid gap-5 sm:grid-cols-2">
          <div><dt className="text-sm font-semibold text-slate-500">目的</dt><dd className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-800">{menu.goal || "未設定"}</dd></div>
          <div><dt className="text-sm font-semibold text-slate-500">説明</dt><dd className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-800">{menu.description || "未設定"}</dd></div>
        </dl>
      </Card>

      <section className="mt-7">
        <h2 className="mb-3 text-lg font-bold text-slate-950">メニュー項目</h2>
        <div className="space-y-3">
          {menu.items.map((item, index) => (
            <Card className="p-4 sm:p-5" key={item.id}>
              <div className="flex gap-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-600 text-sm font-black text-white">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-950">{item.title}</h3>
                    <Badge tone="blue">{practiceMenuCategoryLabels[item.category]}</Badge>
                    {item.durationMin ? <Badge>{item.durationMin}分</Badge> : null}
                  </div>
                  {item.description ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.description}</p> : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <div className="mt-7 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row">
        <Link className={buttonStyles()} href={`/practice/new?practiceMenuId=${menu.id}`}>このメニューで練習記録を作成する</Link>
        <Link className={buttonStyles({ variant: "secondary" })} href="/practice-menus">一覧へ戻る</Link>
        <div className="sm:ml-auto"><PracticeMenuDeleteButton id={menu.id} /></div>
      </div>
    </div>
  );
}
