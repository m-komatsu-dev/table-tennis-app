import { prisma } from "@table-tennis/db";
import {
  dataResponse,
  errorResponse,
  nullableText,
  requireUserId,
  validationErrorResponse
} from "@/lib/api";
import { equipmentSchema } from "@/lib/validators";

export async function GET() {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  const equipment = await prisma.equipment.findMany({
    where: { userId },
    orderBy: [{ isCurrent: "desc" }, { updatedAt: "desc" }]
  });

  return dataResponse(equipment);
}

export async function POST(request: Request) {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  try {
    const body = equipmentSchema.parse(await request.json());
    const equipment = await prisma.equipment.create({
      data: {
        userId,
        blade: body.blade,
        rubberFh: nullableText(body.rubberFh),
        rubberBh: nullableText(body.rubberBh),
        isCurrent: body.isCurrent
      }
    });

    return dataResponse(equipment, { status: 201 });
  } catch (error) {
    return validationErrorResponse(error);
  }
}
