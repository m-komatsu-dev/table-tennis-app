import { prisma } from "@table-tennis/db";
import { mobileError, mobileJson, mobileValidationError, requireMobileAuth } from "@/lib/mobile-api";
import { mobileProfileSchema } from "@/lib/validators";

const mobileProfileSelect = {
  id: true,
  name: true,
  email: true,
  level: true,
  gender: true,
  club: true,
  playStyle: true,
  avatarUrl: true
} as const;

export async function GET(request: Request) {
  const userId = requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: mobileProfileSelect
  });

  if (!user) {
    return mobileError("ユーザーが見つかりません", 404);
  }

  return mobileJson({ user });
}

export async function PUT(request: Request) {
  const userId = requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  let json: unknown;

  try {
    json = await request.json();
  } catch {
    return mobileError("入力内容を確認してください", 400);
  }

  const bodyResult = mobileProfileSchema.safeParse(json);

  if (!bodyResult.success) {
    return mobileValidationError(bodyResult.error);
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: bodyResult.data.name,
        level: bodyResult.data.level,
        gender: bodyResult.data.gender
      },
      select: mobileProfileSelect
    });

    return mobileJson({ user });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return mobileError("ユーザーが見つかりません", 404);
    }

    return mobileError("サーバー側でエラーが発生しました", 500);
  }
}

function isPrismaNotFoundError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2025"
  );
}
