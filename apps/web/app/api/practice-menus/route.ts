import { prisma } from "@table-tennis/db";
import {
  dataResponse,
  errorResponse,
  nullableText,
  requireUserId,
  validationErrorResponse
} from "@/lib/api";
import { practiceMenuSchema } from "@/lib/validators";

export async function GET() {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  const menus = await prisma.practiceMenu.findMany({
    where: { userId },
    include: { items: { orderBy: { order: "asc" } } },
    orderBy: { updatedAt: "desc" }
  });

  return dataResponse(menus);
}

export async function POST(request: Request) {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  try {
    const body = practiceMenuSchema.parse(await request.json());
    const menu = await prisma.practiceMenu.create({
      data: {
        userId,
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

    return dataResponse(menu, { status: 201 });
  } catch (error) {
    return validationErrorResponse(error);
  }
}
