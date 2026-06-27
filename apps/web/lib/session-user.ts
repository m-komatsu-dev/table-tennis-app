import type { Session } from "next-auth";
import { prisma } from "@table-tennis/db";

export async function resolveSessionUserId(session: Session | null) {
  if (session?.user?.id) {
    return session.user.id;
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
