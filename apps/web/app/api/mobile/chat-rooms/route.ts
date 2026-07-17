import { prisma } from "@table-tennis/db";
import { ChatError, chatRoomListInclude, serializeChatRoomsForUser } from "@/lib/chat";
import { mobileError, mobileJson, requireMobileAuth } from "@/lib/mobile-api";

export async function GET(request: Request) {
  const userId = await requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  try {
    const rooms = await prisma.chatRoom.findMany({
      where: {
        partnerRequest: {
          status: "ACCEPTED",
          OR: [{ requesterId: userId }, { post: { ownerId: userId } }]
        }
      },
      include: chatRoomListInclude,
      orderBy: { updatedAt: "desc" }
    });
    const chatRooms = await serializeChatRoomsForUser(rooms, userId);
    return mobileJson({ chatRooms });
  } catch (error) {
    if (error instanceof ChatError) {
      return mobileError(error.message, error.status);
    }

    return mobileError("チャットを読み込めませんでした。", 500);
  }
}
