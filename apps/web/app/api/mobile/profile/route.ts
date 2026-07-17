import { prisma } from "@table-tennis/db";
import { mobileError, mobileJson, mobileValidationError, requireMobileAuth } from "@/lib/mobile-api";
import { mobileProfileSchema } from "@/lib/validators";

const mobileProfileSelect = {
  id: true,
  name: true,
  email: true,
  username: true,
  level: true,
  gender: true,
  club: true,
  playStyle: true,
  avatarUrl: true,
  publicProfileEnabled: true
} as const;

export async function GET(request: Request) {
  const userId = await requireMobileAuth(request);

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
  const userId = await requireMobileAuth(request);

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
        username: nullableProfileUsername(bodyResult.data.username),
        level: bodyResult.data.level,
        gender: bodyResult.data.gender,
        publicProfileEnabled: Boolean(bodyResult.data.publicProfileEnabled && nullableProfileUsername(bodyResult.data.username))
      },
      select: mobileProfileSelect
    });

    return mobileJson({ user });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return mobileError("ユーザーが見つかりません", 404);
    }

    if (isUniqueUsernameError(error)) {
      return mobileError("この公開ユーザー名はすでに使われています", 400);
    }

    return mobileError("サーバー側でエラーが発生しました", 500);
  }
}

function nullableProfileUsername(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

function isPrismaNotFoundError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2025"
  );
}

function isUniqueUsernameError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "P2002";
}
