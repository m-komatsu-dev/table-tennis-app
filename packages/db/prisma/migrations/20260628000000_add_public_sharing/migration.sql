ALTER TABLE "User" ADD COLUMN "username" TEXT;
ALTER TABLE "User" ADD COLUMN "publicProfileEnabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "PracticeLog" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "MatchRecord" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
