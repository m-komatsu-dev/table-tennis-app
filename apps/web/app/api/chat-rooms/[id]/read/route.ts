import { prisma } from "@table-tennis/db";
import { ChatError, markChatRoomRead } from "@/lib/chat";
import { errorResponse, requireUserId } from "@/lib/api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  try {
    const { id } = await context.params;
    const room = await prisma.chatRoom.findFirst({
      where: {
        id,
        partnerRequest: {
          status: "ACCEPTED",
          OR: [{ requesterId: userId }, { post: { ownerId: userId } }]
        }
      },
      select: { id: true }
    });

    if (!room) {
      return errorResponse("このチャットを表示する権限がありません。", 403);
    }

    await markChatRoomRead(id, userId);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof ChatError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("既読状態を更新できませんでした。", 500);
  }
}
