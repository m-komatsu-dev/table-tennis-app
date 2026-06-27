import { prisma } from "@table-tennis/db";
import { ZodError } from "zod";
import { mobileError, mobileJson, mobileValidationError, nullableMobileText, requireMobileAuth } from "@/lib/mobile-api";
import { serializePracticeMenu } from "@/lib/serialize";
import { practiceMenuSchema } from "@/lib/validators";

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

export async function POST(request: Request) {
  const userId = requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  try {
    const body = practiceMenuSchema.parse(await request.json());
    const menu = await prisma.practiceMenu.create({
      data: {
        userId,
        title: body.title,
        description: nullableMobileText(body.description),
        goal: nullableMobileText(body.goal),
        totalMinutes: body.totalMinutes ?? null,
        items: {
          create: body.items.map((item) => ({
            title: item.title,
            description: nullableMobileText(item.description),
            category: item.category,
            durationMin: item.durationMin ?? null,
            order: item.order
          }))
        }
      },
      include: { items: { orderBy: { order: "asc" } } }
    });

    return mobileJson({ practiceMenu: serializePracticeMenu(menu) }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return mobileValidationError(error);
    }

    return mobileError("サーバー側でエラーが発生しました", 500);
  }
}
