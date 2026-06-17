import { prisma } from "@table-tennis/db";
import { Card, PageHeader } from "@/components/ui";
import { ProfileForm } from "@/components/profile-form";
import { getRequiredUserId } from "@/lib/server-auth";
import type { ProfileView } from "@/types/app";

export default async function ProfilePage() {
  const userId = await getRequiredUserId();
  const profile = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      club: true,
      level: true,
      playStyle: true,
      avatarUrl: true
    }
  });

  return (
    <>
      <PageHeader title="プロフィール" description="プレイヤー情報を編集できます。" />
      <Card>
        <ProfileForm profile={profile satisfies ProfileView} />
      </Card>
    </>
  );
}
