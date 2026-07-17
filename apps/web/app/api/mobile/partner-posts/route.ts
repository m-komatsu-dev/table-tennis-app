import { prisma } from "@table-tennis/db";
import { mobileError, mobileJson, mobileValidationError, nullableMobileText, requireMobileAuth } from "@/lib/mobile-api";
import { partnerPostInclude, serializePartnerPost } from "@/lib/partner-posts";
import { blockedPartnerPostWhere } from "@/lib/safety";
import { partnerPostSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const userId = await requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const mine = searchParams.get("mine");

  const posts = await prisma.partnerPost.findMany({
    where: {
      AND: [
        {
          ...(type === "PRACTICE" || type === "MATCH" ? { type } : {}),
          ...(status === "OPEN" || status === "CLOSED" ? { status } : {}),
          ...(mine === "1" ? { ownerId: userId } : {})
        },
        ...(mine === "1" ? [] : [blockedPartnerPostWhere(userId)])
      ]
    },
    include: partnerPostInclude,
    orderBy: { createdAt: "desc" }
  });

  return mobileJson({ partnerPosts: posts.map((post) => serializePartnerPost(post, userId)) });
}

export async function POST(request: Request) {
  const userId = await requireMobileAuth(request);

  if (!userId) {
    return mobileError("認証が必要です", 401);
  }

  try {
    const body = partnerPostSchema.parse(await request.json());
    const post = await prisma.partnerPost.create({
      data: {
        ownerId: userId,
        type: body.type,
        title: body.title,
        area: nullableMobileText(body.area),
        preferredTime: nullableMobileText(body.preferredTime),
        level: nullableMobileText(body.level),
        purpose: nullableMobileText(body.purpose),
        message: nullableMobileText(body.message),
        status: "OPEN"
      },
      include: partnerPostInclude
    });

    return mobileJson({ partnerPost: serializePartnerPost(post, userId) }, { status: 201 });
  } catch (error) {
    return mobileValidationError(error);
  }
}
