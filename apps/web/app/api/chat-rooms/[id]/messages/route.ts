import { ZodError } from "zod";
import { prisma } from "@table-tennis/db";
import { ChatError, createChatMessage } from "@/lib/chat";
import { errorResponse, requireUserId, validationErrorResponse } from "@/lib/api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
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

    const message = await createChatMessage(id, userId, await request.json());
    return Response.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof ChatError) {
      return errorResponse(error.message, error.status);
    }

    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    return errorResponse("メッセージを送信できませんでした。", 500);
  }
}
