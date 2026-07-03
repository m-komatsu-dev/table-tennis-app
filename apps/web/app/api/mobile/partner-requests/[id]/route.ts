import { prisma } from "@table-tennis/db";
import { ensureChatRoomForPartnerRequest } from "@/lib/chat";
import { mobileError, mobileJson, mobileValidationError, requireMobileAuth } from "@/lib/mobile-api";
import { partnerRequestInclude, serializePartnerRequest } from "@/lib/partner-posts";
import { partnerRequestUpdateSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const userId = requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  try {
    const { id } = await context.params;
    const body = partnerRequestUpdateSchema.parse(await request.json());
    const existing = await prisma.partnerRequest.findUnique({
      where: { id },
      select: { post: { select: { ownerId: true } } }
    });

    if (!existing) {
      return mobileError("参加希望が見つかりません", 404);
    }

    if (existing.post.ownerId !== userId) {
      return mobileError("この操作を行う権限がありません", 403);
    }

    const requestRecord = await prisma.partnerRequest.update({
      where: { id },
      data: { status: body.status },
      include: partnerRequestInclude
    });
    const chatRoom = requestRecord.status === "ACCEPTED" ? await ensureChatRoomForPartnerRequest(requestRecord.id) : null;

    return mobileJson({ partnerRequest: serializePartnerRequest(requestRecord), chatRoomId: chatRoom?.id ?? null });
  } catch (error) {
    return mobileValidationError(error);
  }
}
