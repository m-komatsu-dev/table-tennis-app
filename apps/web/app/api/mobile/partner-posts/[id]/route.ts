import { prisma } from "@table-tennis/db";
import { mobileError, mobileJson, mobileValidationError, nullableMobileText, requireMobileAuth } from "@/lib/mobile-api";
import { partnerPostInclude, serializePartnerPost } from "@/lib/partner-posts";
import { getBlockState } from "@/lib/safety";
import { partnerPostUpdateSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const userId = await requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  const { id } = await context.params;
  const post = await prisma.partnerPost.findUnique({
    where: { id },
    include: partnerPostInclude
  });

  if (!post) {
    return mobileError("募集が見つかりません", 404);
  }

  const blockState = await getBlockState(userId, post.ownerId);

  return mobileJson({ partnerPost: serializePartnerPost(post, userId, blockState) });
}

export async function PUT(request: Request, context: RouteContext) {
  const userId = await requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  try {
    const { id } = await context.params;
    const body = partnerPostUpdateSchema.parse(await request.json());
    const existing = await prisma.partnerPost.findUnique({ where: { id }, select: { ownerId: true } });

    if (!existing) {
      return mobileError("募集が見つかりません", 404);
    }

    if (existing.ownerId !== userId) {
      return mobileError("この操作を行う権限がありません", 403);
    }

    const post = await prisma.partnerPost.update({
      where: { id },
      data: {
        type: body.type,
        title: body.title,
        area: nullableMobileText(body.area),
        preferredTime: nullableMobileText(body.preferredTime),
        level: nullableMobileText(body.level),
        purpose: nullableMobileText(body.purpose),
        message: nullableMobileText(body.message),
        status: body.status
      },
      include: partnerPostInclude
    });

    return mobileJson({ partnerPost: serializePartnerPost(post, userId) });
  } catch (error) {
    return mobileValidationError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const userId = await requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  const { id } = await context.params;
  const existing = await prisma.partnerPost.findUnique({ where: { id }, select: { ownerId: true } });

  if (!existing) {
    return mobileError("募集が見つかりません", 404);
  }

  if (existing.ownerId !== userId) {
    return mobileError("この操作を行う権限がありません", 403);
  }

  await prisma.partnerPost.delete({ where: { id } });

  return mobileJson({ ok: true });
}
