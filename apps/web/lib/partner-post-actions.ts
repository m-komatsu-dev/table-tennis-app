"use server";

import { Prisma, prisma } from "@table-tennis/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRequiredUserId } from "@/lib/server-auth";
import { getBlockState } from "@/lib/safety";
import { partnerPostSchema, partnerPostUpdateSchema, partnerRequestSchema, partnerRequestUpdateSchema } from "@/lib/validators";

export async function createPartnerPostAction(formData: FormData) {
  const userId = await getRequiredUserId();
  const body = partnerPostSchema.safeParse(formToPartnerPostInput(formData));

  if (!body.success) {
    redirectWithError("/partner-posts/new", body.error.issues[0]?.message ?? "入力内容を確認してください");
  }

  const post = await prisma.partnerPost.create({
    data: {
      ownerId: userId,
      type: body.data.type,
      title: body.data.title,
      area: nullableText(body.data.area),
      preferredTime: nullableText(body.data.preferredTime),
      level: nullableText(body.data.level),
      purpose: nullableText(body.data.purpose),
      message: nullableText(body.data.message),
      status: "OPEN"
    },
    select: { id: true }
  });

  revalidatePath("/partner-posts");
  redirect(`/partner-posts/${post.id}`);
}

export async function updatePartnerPostAction(formData: FormData) {
  const userId = await getRequiredUserId();
  const id = String(formData.get("id") ?? "");
  const body = partnerPostUpdateSchema.safeParse(formToPartnerPostInput(formData));

  if (!id) {
    redirectWithError("/partner-posts", "募集が見つかりません");
  }

  if (!body.success) {
    redirectWithError(`/partner-posts/${id}/edit`, body.error.issues[0]?.message ?? "入力内容を確認してください");
  }

  const existing = await prisma.partnerPost.findUnique({
    where: { id },
    select: { ownerId: true }
  });

  if (!existing) {
    redirectWithError("/partner-posts", "募集が見つかりません");
  }

  if (existing.ownerId !== userId) {
    redirectWithError(`/partner-posts/${id}`, "この操作を行う権限がありません");
  }

  await prisma.partnerPost.update({
    where: { id },
    data: {
      type: body.data.type,
      title: body.data.title,
      area: nullableText(body.data.area),
      preferredTime: nullableText(body.data.preferredTime),
      level: nullableText(body.data.level),
      purpose: nullableText(body.data.purpose),
      message: nullableText(body.data.message),
      status: body.data.status
    }
  });

  revalidatePartnerPost(id);
  redirect(`/partner-posts/${id}`);
}

export async function closePartnerPostAction(formData: FormData) {
  const userId = await getRequiredUserId();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirectWithError("/partner-posts", "募集が見つかりません");
  }

  const result = await prisma.partnerPost.updateMany({
    where: { id, ownerId: userId },
    data: { status: "CLOSED" }
  });

  if (result.count === 0) {
    redirectWithError(`/partner-posts/${id}`, "この操作を行う権限がありません");
  }

  revalidatePartnerPost(id);
  redirect(`/partner-posts/${id}?success=${encodeURIComponent("募集を締め切りました")}`);
}

export async function deletePartnerPostAction(formData: FormData) {
  const userId = await getRequiredUserId();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirectWithError("/partner-posts", "募集が見つかりません");
  }

  const result = await prisma.partnerPost.deleteMany({
    where: { id, ownerId: userId }
  });

  if (result.count === 0) {
    redirectWithError(`/partner-posts/${id}`, "この操作を行う権限がありません");
  }

  revalidatePath("/partner-posts");
  redirect(`/partner-posts?success=${encodeURIComponent("募集を削除しました")}`);
}

export async function createPartnerRequestAction(formData: FormData) {
  const userId = await getRequiredUserId();
  const postId = String(formData.get("postId") ?? "");
  const body = partnerRequestSchema.safeParse({
    message: String(formData.get("message") ?? "")
  });

  if (!postId) {
    redirectWithError("/partner-posts", "募集が見つかりません");
  }

  if (!body.success) {
    redirectWithError(`/partner-posts/${postId}`, body.error.issues[0]?.message ?? "入力内容を確認してください");
  }

  const post = await prisma.partnerPost.findUnique({
    where: { id: postId },
    select: { ownerId: true, status: true }
  });

  if (!post) {
    redirectWithError("/partner-posts", "募集が見つかりません");
  }

  if (post.ownerId === userId) {
    redirectWithError(`/partner-posts/${postId}`, "自分の募集には参加希望を送れません");
  }

  if (post.status !== "OPEN") {
    redirectWithError(`/partner-posts/${postId}`, "締め切られた募集には参加希望を送れません");
  }

  const blockState = await getBlockState(userId, post.ownerId);

  if (blockState.isBlocked) {
    redirectWithError(`/partner-posts/${postId}`, "このユーザーとは現在やり取りできません。");
  }

  try {
    await prisma.partnerRequest.create({
      data: {
        postId,
        requesterId: userId,
        message: nullableText(body.data.message)
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirectWithError(`/partner-posts/${postId}`, "すでに参加希望を送っています");
    }

    throw error;
  }

  revalidatePartnerPost(postId);
  redirect(`/partner-posts/${postId}?success=${encodeURIComponent("参加希望を送信しました")}`);
}

export async function updatePartnerRequestAction(formData: FormData) {
  const userId = await getRequiredUserId();
  const id = String(formData.get("id") ?? "");
  const postId = String(formData.get("postId") ?? "");
  const body = partnerRequestUpdateSchema.safeParse({
    status: String(formData.get("status") ?? "")
  });

  if (!id || !postId) {
    redirectWithError("/partner-posts", "参加希望が見つかりません");
  }

  if (!body.success) {
    redirectWithError(`/partner-posts/${postId}/requests`, body.error.issues[0]?.message ?? "入力内容を確認してください");
  }

  const existing = await prisma.partnerRequest.findUnique({
    where: { id },
    select: { post: { select: { ownerId: true } } }
  });

  if (!existing) {
    redirectWithError(`/partner-posts/${postId}/requests`, "参加希望が見つかりません");
  }

  if (existing.post.ownerId !== userId) {
    redirectWithError(`/partner-posts/${postId}`, "この操作を行う権限がありません");
  }

  await prisma.partnerRequest.update({
    where: { id },
    data: { status: body.data.status }
  });

  revalidatePath(`/partner-posts/${postId}/requests`);
  revalidatePath(`/partner-posts/${postId}`);
  redirect(`/partner-posts/${postId}/requests?success=${encodeURIComponent("参加希望の状態を更新しました")}`);
}

function formToPartnerPostInput(formData: FormData) {
  return {
    type: String(formData.get("type") ?? ""),
    title: String(formData.get("title") ?? ""),
    area: String(formData.get("area") ?? ""),
    preferredTime: String(formData.get("preferredTime") ?? ""),
    level: String(formData.get("level") ?? ""),
    purpose: String(formData.get("purpose") ?? ""),
    message: String(formData.get("message") ?? ""),
    status: String(formData.get("status") ?? "OPEN")
  };
}

function nullableText(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function revalidatePartnerPost(id: string) {
  revalidatePath("/partner-posts");
  revalidatePath(`/partner-posts/${id}`);
  revalidatePath(`/partner-posts/${id}/edit`);
  revalidatePath(`/partner-posts/${id}/requests`);
}

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}
