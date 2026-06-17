import { prisma } from "@table-tennis/db";
import {
  dataResponse,
  errorResponse,
  nullableText,
  requireUserId,
  validationErrorResponse
} from "@/lib/api";
import { profileSchema } from "@/lib/validators";

export async function GET() {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      level: true,
      playStyle: true,
      club: true,
      avatarUrl: true
    }
  });

  if (!profile) {
    return errorResponse("ユーザーが見つかりません", 404);
  }

  return dataResponse(profile);
}

export async function PATCH(request: Request) {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  try {
    const body = profileSchema.parse(await request.json());
    const profile = await prisma.user.update({
      where: { id: userId },
      data: {
        name: body.name,
        level: body.level,
        club: nullableText(body.club),
        playStyle: nullableText(body.playStyle),
        avatarUrl: nullableText(body.avatarUrl)
      },
      select: {
        id: true,
        email: true,
        name: true,
        level: true,
        playStyle: true,
        club: true,
        avatarUrl: true
      }
    });

    return dataResponse(profile);
  } catch (error) {
    return validationErrorResponse(error);
  }
}
