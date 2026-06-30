import { prisma } from "@table-tennis/db";
import { mobileError, mobileJson, mobileValidationError, requireMobileAuth } from "@/lib/mobile-api";
import { createReport, SafetyError } from "@/lib/safety";

export async function POST(request: Request) {
  const userId = requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  try {
    const reporter = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });

    if (!reporter) {
      return mobileError("認証が必要です", 401);
    }

    await createReport(userId, await request.json());
    return mobileJson({ message: "通報を受け付けました。内容を確認します。" }, { status: 201 });
  } catch (error) {
    if (error instanceof SafetyError) {
      return mobileError(error.message, error.status);
    }

    return mobileValidationError(error);
  }
}
