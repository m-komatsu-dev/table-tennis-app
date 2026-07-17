import type { FeedbackCategory, FeedbackPlatform, FeedbackStatus } from "@table-tennis/db";
import { errorResponse, requireUserId } from "@/lib/api";
import { isAdminUserId } from "@/lib/admin";
import { getAdminFeedbackList, serializeAdminFeedback, type FeedbackFilters } from "@/lib/admin-feedback";
import { feedbackCategoryLabels, feedbackPlatformLabels, feedbackStatusLabels } from "@/lib/feedback-options";

const feedbackStatuses = Object.keys(feedbackStatusLabels) as FeedbackStatus[];
const feedbackCategories = Object.keys(feedbackCategoryLabels) as FeedbackCategory[];
const feedbackPlatforms = Object.keys(feedbackPlatformLabels) as FeedbackPlatform[];

export async function GET(request: Request) {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  if (!(await isAdminUserId(userId))) {
    return errorResponse("このページを表示する権限がありません。", 403);
  }

  const url = new URL(request.url);
  const filters: FeedbackFilters = {
    status: enumParam(url.searchParams.get("status"), feedbackStatuses),
    category: enumParam(url.searchParams.get("category"), feedbackCategories),
    platform: enumParam(url.searchParams.get("platform"), feedbackPlatforms)
  };
  const result = await getAdminFeedbackList(filters);

  return Response.json({
    totalCount: result.totalCount,
    feedbacks: result.feedbacks.map(serializeAdminFeedback)
  });
}

function enumParam<T extends string>(value: string | null, allowed: T[]) {
  return value && allowed.includes(value as T) ? (value as T) : undefined;
}
