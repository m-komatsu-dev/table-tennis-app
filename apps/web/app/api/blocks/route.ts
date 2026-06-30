import { prisma } from "@table-tennis/db";
import { errorResponse, requireUserId, validationErrorResponse } from "@/lib/api";
import { blockUser, SafetyError } from "@/lib/safety";

export async function GET() {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  const blocks = await prisma.userBlock.findMany({
    where: { blockerId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      blockedId: true,
      createdAt: true,
      blocked: {
        select: {
          name: true,
          username: true,
          publicProfileEnabled: true
        }
      }
    }
  });

  return Response.json({
    blocks: blocks.map((block) => ({
      blockedUserId: block.blockedId,
      createdAt: block.createdAt.toISOString(),
      user: {
        name: block.blocked.name,
        username: block.blocked.publicProfileEnabled ? block.blocked.username : null,
        publicProfileEnabled: block.blocked.publicProfileEnabled
      }
    }))
  });
}

export async function POST(request: Request) {
  const userId = await requireUserId();

  if (!userId) {
    return errorResponse("認証が必要です", 401);
  }

  try {
    await blockUser(userId, await request.json());
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof SafetyError) {
      return errorResponse(error.message, error.status);
    }

    return validationErrorResponse(error);
  }
}
