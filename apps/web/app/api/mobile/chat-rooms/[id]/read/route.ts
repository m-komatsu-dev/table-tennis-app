import { prisma } from "@table-tennis/db";
import { ChatError, markChatRoomRead } from "@/lib/chat";
import { mobileError, mobileJson, requireMobileAuth } from "@/lib/mobile-api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const userId = requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
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
      return mobileError("このチャットを表示する権限がありません。", 403);
    }

    await markChatRoomRead(id, userId);
    return mobileJson({ ok: true });
  } catch (error) {
    if (error instanceof ChatError) {
      return mobileError(error.message, error.status);
    }

    return mobileError("既読状態を更新できませんでした。", 500);
  }
}
