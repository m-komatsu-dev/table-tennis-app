import { prisma } from "@table-tennis/db";
import { mobileError, mobileJson, mobileValidationError, requireMobileAuth } from "@/lib/mobile-api";
import { blockUser, SafetyError } from "@/lib/safety";

export async function GET(request: Request) {
  const userId = requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
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

  return mobileJson({
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
  const userId = requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  try {
    await blockUser(userId, await request.json());
    return mobileJson({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof SafetyError) {
      return mobileError(error.message, error.status);
    }

    return mobileValidationError(error);
  }
}
