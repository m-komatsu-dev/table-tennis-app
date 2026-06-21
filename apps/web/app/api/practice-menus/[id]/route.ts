import { prisma } from "@table-tennis/db";
import {
  dataResponse,
  errorResponse,
  nullableText,
  requireUserId,
  validationErrorResponse
} from "@/lib/api";
import { practiceMenuSchema } from "@/lib/validators";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  const { id } = await params;
  const menu = await prisma.practiceMenu.findFirst({
    where: { id, userId },
    include: { items: { orderBy: { order: "asc" } } }
  });

  if (!menu) {
    return errorResponse("練習メニューが見つかりません", 404);
  }

  return dataResponse(menu);
}

export async function PATCH(request: Request, { params }: Params) {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  try {
    const { id } = await params;
    const body = practiceMenuSchema.parse(await request.json());
    const ownedMenu = await prisma.practiceMenu.findFirst({
      where: { id, userId },
      select: { id: true }
    });

    if (!ownedMenu) {
      return errorResponse("練習メニューが見つかりません", 404);
    }

    const menu = await prisma.$transaction(async (tx) => {
      await tx.practiceMenuItem.deleteMany({ where: { practiceMenuId: id } });
      return tx.practiceMenu.update({
        where: { id },
        data: {
          title: body.title,
          description: nullableText(body.description),
          goal: nullableText(body.goal),
          totalMinutes: body.totalMinutes ?? null,
          items: {
            create: body.items.map((item) => ({
              title: item.title,
              description: nullableText(item.description),
              category: item.category,
              durationMin: item.durationMin ?? null,
              order: item.order
            }))
          }
        },
        include: { items: { orderBy: { order: "asc" } } }
      });
    });

    return dataResponse(menu);
  } catch (error) {
    return validationErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  const { id } = await params;
  const result = await prisma.practiceMenu.deleteMany({
    where: { id, userId }
  });

  if (result.count === 0) {
    return errorResponse("練習メニューが見つかりません", 404);
  }

  return dataResponse({ id });
}
