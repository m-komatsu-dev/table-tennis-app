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
      username: true,
      name: true,
      level: true,
      playStyle: true,
      club: true,
      avatarUrl: true,
      gender: true,
      publicProfileEnabled: true
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
        username: nullableText(body.username),
        level: body.level,
        gender: body.gender,
        club: nullableText(body.club),
        playStyle: nullableText(body.playStyle),
        avatarUrl: nullableText(body.avatarUrl),
        publicProfileEnabled: Boolean(body.publicProfileEnabled && nullableText(body.username))
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        level: true,
        playStyle: true,
        club: true,
        avatarUrl: true,
        gender: true,
        publicProfileEnabled: true
      }
    });

    return dataResponse(profile);
  } catch (error) {
    if (isUniqueUsernameError(error)) {
      return errorResponse("この公開ユーザー名はすでに使われています", 400);
    }

    return validationErrorResponse(error);
  }
}

function isUniqueUsernameError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "P2002";
}
