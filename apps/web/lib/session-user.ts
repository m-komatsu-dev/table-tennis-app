import type { Session } from "next-auth";
import { prisma } from "@table-tennis/db";

export async function resolveSessionUserId(session: Session | null) {
  const sessionUserId = session?.user?.id;

  if (sessionUserId) {
    const user = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { id: true }
    });

    return user?.id ?? null;
  }

  const email = session?.user?.email?.toLowerCase();

  if (!email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });

  return user?.id ?? null;
}
