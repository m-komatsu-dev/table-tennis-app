import { prisma } from "@table-tennis/db";
import { Card, PageHeader } from "@/components/ui";
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
        name: true,
        club: true,
        level: true,
        gender: true,
        playStyle: true,
        avatarUrl: true
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
