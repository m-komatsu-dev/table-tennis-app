import { redirect } from "next/navigation";
import { prisma } from "@table-tennis/db";
import { auth } from "@/auth";
import { AccountDeleteLite } from "@/components/account-delete-lite";
import { Card, PageHeader } from "@/components/ui";
import { GOOGLE_REAUTH_WINDOW_SECONDS } from "@/lib/account-deletion";
import { resolveSessionUserId } from "@/lib/session-user";

export default async function AccountDeletePage() {
  const session = await auth();
  const userId = await resolveSessionUserId(session);

  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      passwordHash: true,
      googleId: true
    }
  });
  const authMethod = user.passwordHash ? "password" : user.googleId ? "google" : "unsupported";
  const isGoogleReauthenticated = isRecent(session?.user?.googleReauthenticatedAt);

  return (
    <>
      <PageHeader
        title="アカウント削除"
        description="本人確認後、アカウントと関連データを削除します。"
      />
      <Card className="border-red-200 p-5 sm:p-7">
        <AccountDeleteLite authMethod={authMethod} isGoogleReauthenticated={isGoogleReauthenticated} />
      </Card>
    </>
  );
}

function isRecent(value: number | undefined) {
  if (!value) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  return value <= now && now - value <= GOOGLE_REAUTH_WINDOW_SECONDS;
}
