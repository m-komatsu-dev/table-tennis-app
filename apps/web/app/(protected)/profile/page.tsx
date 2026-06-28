import Link from "next/link";
import { prisma } from "@table-tennis/db";
import { Card, PageHeader, buttonStyles } from "@/components/ui";
import { EquipmentManager } from "@/components/equipment-manager";
import { ProfileForm } from "@/components/profile-form";
import { serializeEquipmentList } from "@/lib/serialize";
import { getRequiredUserId } from "@/lib/server-auth";
import type { ProfileView } from "@/types/app";

export default async function ProfilePage() {
  const userId = await getRequiredUserId();
  const [profile, equipment] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        email: true,
        username: true,
        name: true,
        club: true,
        level: true,
        gender: true,
        playStyle: true,
        avatarUrl: true,
        publicProfileEnabled: true
      }
    }),
    prisma.equipment.findMany({
      where: { userId },
      orderBy: [{ isCurrent: "desc" }, { updatedAt: "desc" }]
    })
  ]);

  return (
    <>
      <PageHeader title="プロフィール" description="プレイヤー情報を編集できます。" />
      <Card className="p-5 sm:p-7">
        <ProfileForm profile={profile satisfies ProfileView} />
      </Card>
      <section className="mt-8">
        <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 h-1 w-10 rounded-full bg-emerald-500" />
            <h2 className="text-xl font-bold tracking-tight text-slate-950">自分の募集</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">練習相手・試合相手の募集を作成し、届いた参加希望を確認できます。</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link className={buttonStyles({ variant: "secondary" })} href="/partner-posts">
              募集を見る
            </Link>
            <Link className={buttonStyles()} href="/partner-posts/new">
              募集を作成
            </Link>
          </div>
        </Card>
      </section>
      <section className="mt-8">
        <div className="mb-2 h-1 w-10 rounded-full bg-emerald-500" />
        <h2 className="text-xl font-bold tracking-tight text-slate-950">使用用具</h2>
        <p className="mt-1 text-sm text-slate-600">ラケット、グリップ、ラバーと厚さを登録できます。</p>
        <div className="mt-4">
          <EquipmentManager initialEquipment={serializeEquipmentList(equipment)} />
        </div>
      </section>
    </>
  );
}
