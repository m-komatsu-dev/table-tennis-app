import { prisma } from "@table-tennis/db";
import { ChatError, chatRoomListInclude, serializeChatRoomsForUser } from "@/lib/chat";
import { errorResponse, requireUserId } from "@/lib/api";

export async function GET() {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
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
    return Response.json({ chatRooms });
  } catch (error) {
    if (error instanceof ChatError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("チャットを読み込めませんでした。", 500);
  }
}
