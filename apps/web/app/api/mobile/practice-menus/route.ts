import { prisma } from "@table-tennis/db";
import { mobileError, mobileJson, requireMobileAuth } from "@/lib/mobile-api";
import { serializePracticeMenu } from "@/lib/serialize";

export async function GET(request: Request) {
  const userId = requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  const menus = await prisma.practiceMenu.findMany({
    where: { userId },
    include: { items: { orderBy: { order: "asc" } } },
    orderBy: { updatedAt: "desc" }
  });

  return mobileJson({ practiceMenus: menus.map(serializePracticeMenu) });
}
