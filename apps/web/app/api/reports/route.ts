import { prisma } from "@table-tennis/db";
import { errorResponse, requireUserId, validationErrorResponse } from "@/lib/api";
import { createReport, SafetyError } from "@/lib/safety";

export async function POST(request: Request) {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  try {
    const reporter = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });

    if (!reporter) {
      return errorResponse("認証が必要です", 401);
    }

    await createReport(userId, await request.json());
    return Response.json({ message: "通報を受け付けました。内容を確認します。" }, { status: 201 });
  } catch (error) {
    if (error instanceof SafetyError) {
      return errorResponse(error.message, error.status);
    }

    return validationErrorResponse(error);
  }
}
