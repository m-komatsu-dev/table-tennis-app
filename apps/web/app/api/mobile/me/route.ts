import { prisma } from "@table-tennis/db";
import { mobileError, mobileJson, requireMobileAuth } from "@/lib/mobile-api";

export async function GET(request: Request) {
  const userId = requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      level: true,
      gender: true,
      publicProfileEnabled: true
    }
  });

  if (!user) {
    return mobileError("ユーザーが見つかりません", 404);
  }

  return mobileJson({ user });
}
