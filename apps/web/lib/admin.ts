import { prisma } from "@table-tennis/db";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin-emails";
import { resolveSessionUserId } from "@/lib/session-user";

export async function isAdminUserId(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  });

  return isAdminEmail(user?.email);
}

export async function getAdminUserId() {
  const session = await auth();
  const userId = await resolveSessionUserId(session);

  if (!userId) {
    return null;
  }

  return (await isAdminUserId(userId)) ? userId : null;
}
