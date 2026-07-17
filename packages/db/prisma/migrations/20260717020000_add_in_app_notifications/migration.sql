CREATE TYPE "NotificationType" AS ENUM ('CHAT_MESSAGE', 'PARTNER_REQUEST_RECEIVED', 'PARTNER_REQUEST_ACCEPTED');

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "chatRoomId" TEXT,
  "chatMessageId" TEXT,
  "partnerPostId" TEXT,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX "Notification_chatMessageId_idx" ON "Notification"("chatMessageId");
CREATE INDEX "Notification_chatRoomId_idx" ON "Notification"("chatRoomId");
CREATE UNIQUE INDEX "Notification_userId_type_chatMessageId_key" ON "Notification"("userId", "type", "chatMessageId");

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id");
