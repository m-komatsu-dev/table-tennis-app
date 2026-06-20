import { prisma } from "@table-tennis/db";
import {
  dataResponse,
  errorResponse,
  nullableText,
  requireUserId,
  validationErrorResponse
} from "@/lib/api";
import { equipmentSchema } from "@/lib/validators";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  const { id } = await params;
  const equipment = await prisma.equipment.findFirst({
    where: { id, userId }
  });

  if (!equipment) {
    return errorResponse("用具が見つかりません", 404);
  }

  return dataResponse(equipment);
}

export async function PATCH(request: Request, { params }: Params) {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  try {
    const { id } = await params;
    const body = equipmentSchema.parse(await request.json());
    const result = await prisma.equipment.updateMany({
      where: { id, userId },
      data: {
        blade: body.blade,
        rubberFh: nullableText(body.rubberFh),
        rubberFhThickness: nullableText(body.rubberFhThickness),
        rubberBh: nullableText(body.rubberBh),
        rubberBhThickness: nullableText(body.rubberBhThickness),
        gripType: nullableText(body.gripType),
        isCurrent: body.isCurrent
      }
    });

    if (result.count === 0) {
      return errorResponse("用具が見つかりません", 404);
    }

    const equipment = await prisma.equipment.findFirstOrThrow({
      where: { id, userId }
    });

    return dataResponse(equipment);
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
  const result = await prisma.equipment.deleteMany({
    where: { id, userId }
  });

  if (result.count === 0) {
    return errorResponse("用具が見つかりません", 404);
  }

  return dataResponse({ id });
}
