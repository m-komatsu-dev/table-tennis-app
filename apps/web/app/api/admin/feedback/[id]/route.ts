import { errorResponse, requireUserId, validationErrorResponse } from "@/lib/api";
import { isAdminUserId } from "@/lib/admin";
import { getAdminFeedbackDetail, serializeAdminFeedback, updateAdminFeedback } from "@/lib/admin-feedback";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  if (!(await isAdminUserId(userId))) {
    return errorResponse("このページを表示する権限がありません。", 403);
  }

  const { id } = await context.params;
  const feedback = await getAdminFeedbackDetail(id);

  if (!feedback) {
    return errorResponse("フィードバックが見つかりません。", 404);
  }

  return Response.json({ feedback: serializeAdminFeedback(feedback) });
}

export async function PATCH(request: Request, context: RouteContext) {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  if (!(await isAdminUserId(userId))) {
    return errorResponse("このページを表示する権限がありません。", 403);
  }

  const { id } = await context.params;

  try {
    const updated = await updateAdminFeedback(id, await request.json());

    if (!updated) {
      return errorResponse("フィードバックが見つかりません。", 404);
    }

    return Response.json({ ok: true });
  } catch (error) {
    return validationErrorResponse(error);
  }
}
