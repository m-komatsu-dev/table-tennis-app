import { prisma } from "@table-tennis/db";
import type { Notification, NotificationType, Prisma } from "@table-tennis/db";

const maxNotifications = 100;
const chatMessageNotificationType = "CHAT_MESSAGE" satisfies NotificationType;

type NotificationClient = Prisma.TransactionClient | typeof prisma;

export type SerializedNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  chatRoomId: string | null;
  chatMessageId: string | null;
  partnerPostId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  actionPath: string | null;
};

export class NotificationError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export async function getNotificationsForUser(userId: string, limit = maxNotifications) {
  const take = clampLimit(limit);
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take
    }),
    prisma.notification.count({
      where: { userId, isRead: false }
    })
  ]);

  return {
    notifications: notifications.map(serializeNotification),
    unreadCount
  };
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: { userId, isRead: false }
  });
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId }
  });

  if (!notification) {
    throw new NotificationError("通知を読み込めませんでした。", 404);
  }

  if (notification.isRead) {
    return serializeNotification(notification);
  }

  const updated = await prisma.notification.update({
    where: { id: notification.id },
    data: { isRead: true, readAt: new Date() }
  });

  return serializeNotification(updated);
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() }
  });
}

export async function markChatRoomNotificationsRead(roomId: string, userId: string, client: NotificationClient = prisma) {
  await client.notification.updateMany({
    where: {
      userId,
      type: chatMessageNotificationType,
      chatRoomId: roomId,
      isRead: false
    },
    data: { isRead: true, readAt: new Date() }
  });
}

export async function createChatMessageNotification(
  client: NotificationClient,
  {
    recipientId,
    senderName,
    chatRoomId,
    chatMessageId,
    partnerPostId,
    partnerPostTitle
  }: {
    recipientId: string;
    senderName: string;
    chatRoomId: string;
    chatMessageId: string;
    partnerPostId: string;
    partnerPostTitle: string;
  }
) {
  const safeName = cleanNotificationText(senderName, 40) || "相手";
  const safePostTitle = cleanNotificationText(partnerPostTitle, 60);

  await client.notification.upsert({
    where: {
      userId_type_chatMessageId: {
        userId: recipientId,
        type: chatMessageNotificationType,
        chatMessageId
      }
    },
    update: {},
    create: {
      userId: recipientId,
      type: chatMessageNotificationType,
      title: "新しいメッセージがあります",
      body: safePostTitle
        ? `${safeName}さんから「${safePostTitle}」についてメッセージが届きました。`
        : `${safeName}さんからメッセージが届きました。`,
      chatRoomId,
      chatMessageId,
      partnerPostId
    }
  });
}

export function serializeNotification(notification: Notification): SerializedNotification {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    chatRoomId: notification.chatRoomId,
    chatMessageId: notification.chatMessageId,
    partnerPostId: notification.partnerPostId,
    isRead: notification.isRead,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
    actionPath: getNotificationActionPath(notification)
  };
}

export function getNotificationActionPath(notification: Pick<Notification, "type" | "chatRoomId">) {
  if (notification.type === chatMessageNotificationType && notification.chatRoomId) {
    return `/chat/${notification.chatRoomId}`;
  }

  return null;
}

function clampLimit(limit: number) {
  if (!Number.isFinite(limit)) {
    return maxNotifications;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), maxNotifications);
}

function cleanNotificationText(value: string, maxLength: number) {
  const singleLine = value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();

  if (singleLine.length <= maxLength) {
    return singleLine;
  }

  return `${singleLine.slice(0, maxLength)}...`;
}
