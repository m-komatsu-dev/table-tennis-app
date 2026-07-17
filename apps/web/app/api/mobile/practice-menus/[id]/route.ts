import { prisma } from "@table-tennis/db";
import { ZodError } from "zod";
import { mobileError, mobileJson, mobileValidationError, nullableMobileText, requireMobileAuth } from "@/lib/mobile-api";
import { serializePracticeMenu } from "@/lib/serialize";
import { practiceMenuSchema } from "@/lib/validators";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Params) {
  const userId = await requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  const { id } = await params;
  const menu = await prisma.practiceMenu.findFirst({
    where: { id, userId },
    include: { items: { orderBy: { order: "asc" } } }
  });

  if (!menu) {
    return mobileError("練習メニューが見つかりません", 404);
  }

  return mobileJson({ practiceMenu: serializePracticeMenu(menu) });
}

export async function PUT(request: Request, { params }: Params) {
  const userId = await requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  try {
    const { id } = await params;
    const body = practiceMenuSchema.parse(await request.json());
    const ownedMenu = await prisma.practiceMenu.findFirst({
      where: { id, userId },
      select: { id: true }
    });

    if (!ownedMenu) {
      return mobileError("練習メニューが見つかりません", 404);
    }

    const menu = await prisma.$transaction(async (tx) => {
      await tx.practiceMenuItem.deleteMany({ where: { practiceMenuId: id } });
      return tx.practiceMenu.update({
        where: { id },
        data: {
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
    });

    return mobileJson({ practiceMenu: serializePracticeMenu(menu) });
  } catch (error) {
    if (error instanceof ZodError) {
      return mobileValidationError(error);
    }

    return mobileError("サーバー側でエラーが発生しました", 500);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const userId = await requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  const { id } = await params;
  const result = await prisma.practiceMenu.deleteMany({
    where: { id, userId }
  });

  if (result.count === 0) {
    return mobileError("練習メニューが見つかりません", 404);
  }

  return mobileJson({ ok: true });
}
