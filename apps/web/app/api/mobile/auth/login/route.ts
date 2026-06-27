import bcrypt from "bcryptjs";
import { prisma } from "@table-tennis/db";
import { loginSchema } from "@/lib/validators";
import { createMobileAccessToken, MobileAuthConfigError } from "@/lib/mobile-auth";
import { mobileError, mobileJson, mobileValidationError } from "@/lib/mobile-api";

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      select: { id: true, name: true, email: true, passwordHash: true }
    });

    if (!user?.passwordHash) {
      return mobileError("メールアドレスまたはパスワードが正しくありません", 401);
    }

    const isValid = await bcrypt.compare(body.password, user.passwordHash);

    if (!isValid) {
      return mobileError("メールアドレスまたはパスワードが正しくありません", 401);
    }

    const accessToken = createMobileAccessToken(user.id);

    return mobileJson({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    if (error instanceof MobileAuthConfigError) {
      return mobileError("モバイル認証設定が不足しています", 500);
    }

    return mobileValidationError(error);
  }
}
