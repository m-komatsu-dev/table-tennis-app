import { isAdminUserId } from "@/lib/admin";
import { dataResponse, errorResponse, requireUserId, validationErrorResponse } from "@/lib/api";
import { updateAdminReportStatus } from "@/lib/admin-reports";
import { reportStatusSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  if (!(await isAdminUserId(userId))) {
    return errorResponse("このページを表示する権限がありません。", 403);
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const status = reportStatusSchema.parse(body.status);
    const updated = await updateAdminReportStatus(id, status);

    if (!updated) {
      return errorResponse("通報詳細を読み込めませんでした。", 404);
    }

    return dataResponse({ id, status, message: "通報ステータスを更新しました。" });
  } catch (error) {
    return validationErrorResponse(error);
  }
}
