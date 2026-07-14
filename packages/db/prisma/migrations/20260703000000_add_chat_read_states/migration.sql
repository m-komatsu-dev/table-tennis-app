CREATE TABLE "ChatReadState" (
  "id" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ChatReadState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChatReadState_roomId_userId_key" ON "ChatReadState"("roomId", "userId");
CREATE INDEX "ChatReadState_userId_idx" ON "ChatReadState"("userId");
CREATE INDEX "ChatReadState_roomId_idx" ON "ChatReadState"("roomId");

ALTER TABLE "ChatReadState" ADD CONSTRAINT "ChatReadState_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatReadState" ADD CONSTRAINT "ChatReadState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
