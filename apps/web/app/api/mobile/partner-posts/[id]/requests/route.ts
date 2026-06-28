import { prisma } from "@table-tennis/db";
import { mobileError, mobileJson, mobileValidationError, nullableMobileText, requireMobileAuth } from "@/lib/mobile-api";
import { partnerRequestInclude, serializePartnerRequest } from "@/lib/partner-posts";
import { partnerRequestSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const userId = requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  const { id } = await context.params;
  const post = await prisma.partnerPost.findUnique({ where: { id }, select: { ownerId: true } });

  if (!post) {
    return mobileError("募集が見つかりません", 404);
  }

  if (post.ownerId !== userId) {
    return mobileError("この操作を行う権限がありません", 403);
  }

  const requests = await prisma.partnerRequest.findMany({
    where: { postId: id },
    include: partnerRequestInclude,
    orderBy: { createdAt: "desc" }
  });

  return mobileJson({ partnerRequests: requests.map(serializePartnerRequest) });
}

export async function POST(request: Request, context: RouteContext) {
  const userId = requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  try {
    const { id } = await context.params;
    const body = partnerRequestSchema.parse(await request.json());
    const post = await prisma.partnerPost.findUnique({
      where: { id },
      select: { ownerId: true, status: true }
    });

    if (!post) {
      return mobileError("募集が見つかりません", 404);
    }

    if (post.ownerId === userId) {
      return mobileError("自分の募集には参加希望を送れません", 403);
    }

    if (post.status !== "OPEN") {
      return mobileError("締め切られた募集には参加希望を送れません", 400);
    }

    const existing = await prisma.partnerRequest.findUnique({
      where: { postId_requesterId: { postId: id, requesterId: userId } },
      select: { id: true }
    });

    if (existing) {
      return mobileError("すでに参加希望を送っています", 409);
    }

    const requestRecord = await prisma.partnerRequest.create({
      data: {
        postId: id,
        requesterId: userId,
        message: nullableMobileText(body.message)
      },
      include: partnerRequestInclude
    });

    return mobileJson({ partnerRequest: serializePartnerRequest(requestRecord) }, { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return mobileError("すでに参加希望を送っています", 409);
    }

    return mobileValidationError(error);
  }
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "P2002";
}
