import Link from "next/link";
import { prisma } from "@table-tennis/db";
import { Button, Card, EmptyState, ErrorMessage, PageHeader, SuccessMessage, buttonStyles } from "@/components/ui";
import { EquipmentManager } from "@/components/equipment-manager";
import { PasswordChangeLite } from "@/components/password-change-lite";
import { ProfileForm } from "@/components/profile-form";
import { serializeEquipmentList } from "@/lib/serialize";
import { unblockUserAction } from "@/lib/safety-actions";
import { getRequiredUserId } from "@/lib/server-auth";
import type { ProfileView } from "@/types/app";

type PageProps = {
  searchParams: Promise<{ error?: string | string[]; success?: string | string[] }>;
};

export default async function ProfilePage({ searchParams }: PageProps) {
  const userId = await getRequiredUserId();
  const params = await searchParams;
  const [profile, equipment, blocks] = await Promise.all([
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
        publicProfileEnabled: true,
        passwordHash: true
      }
    }),
    prisma.equipment.findMany({
      where: { userId },
      orderBy: [{ isCurrent: "desc" }, { updatedAt: "desc" }]
    }),
    prisma.userBlock.findMany({
      where: { blockerId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        blockedId: true,
        blocked: {
          select: {
            name: true,
            username: true,
            publicProfileEnabled: true
          }
        }
      }
    })
  ]);
  const profileView: ProfileView = {
    email: profile.email,
    username: profile.username,
    name: profile.name,
    club: profile.club,
    level: profile.level,
    gender: profile.gender,
    playStyle: profile.playStyle,
    avatarUrl: profile.avatarUrl,
    publicProfileEnabled: profile.publicProfileEnabled
  };
  const canChangePassword = Boolean(profile.passwordHash);

  return (
    <>
      <PageHeader title="プロフィール" description="プレイヤー情報を編集できます。" />
      <div className="mb-5 space-y-3">
        <ErrorMessage message={singleParam(params.error)} />
        <SuccessMessage message={singleParam(params.success)} />
      </div>
      <Card className="p-5 sm:p-7">
        <ProfileForm profile={profileView} />
      </Card>
      <Card className="mt-8 p-5 sm:p-7">
        <PasswordChangeLite canChangePassword={canChangePassword} />
      </Card>
      <section className="mt-8">
        <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 h-1 w-10 rounded-full bg-emerald-500" />
            <h2 className="text-xl font-bold tracking-tight text-slate-950">法的情報</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">利用規約とプライバシーポリシーを確認できます。</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link className={buttonStyles({ variant: "secondary" })} href="/terms">
              利用規約
            </Link>
            <Link className={buttonStyles({ variant: "secondary" })} href="/privacy">
              プライバシーポリシー
            </Link>
          </div>
        </Card>
      </section>
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
        <h2 className="text-xl font-bold tracking-tight text-slate-950">ブロック中のユーザー</h2>
        <p className="mt-1 text-sm text-slate-600">ブロック関係にあるユーザーの募集や参加希望は制限されます。</p>
        <div className="mt-4 space-y-3">
          {blocks.length === 0 ? (
            <EmptyState>
              <p className="font-semibold text-slate-800">ブロック中のユーザーはいません。</p>
            </EmptyState>
          ) : (
            blocks.map((block) => (
              <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" key={block.blockedId}>
                <div>
                  <p className="font-bold text-slate-950">{block.blocked.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {block.blocked.publicProfileEnabled && block.blocked.username ? `@${block.blocked.username}` : "公開プロフィール非公開"}
                  </p>
                </div>
                <form action={unblockUserAction}>
                  <input name="blockedUserId" type="hidden" value={block.blockedId} />
                  <input name="returnTo" type="hidden" value="/profile" />
                  <Button type="submit" variant="secondary">
                    ブロック解除
                  </Button>
                </form>
              </Card>
            ))
          )}
        </div>
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

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
