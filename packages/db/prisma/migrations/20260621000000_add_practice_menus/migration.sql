-- CreateEnum
CREATE TYPE "PracticeMenuCategory" AS ENUM ('SERVE', 'RECEIVE', 'FOREHAND', 'BACKHAND', 'FOOTWORK', 'DRIVE', 'BLOCK', 'GAME', 'PHYSICAL', 'MENTAL', 'OTHER');

-- CreateTable
CREATE TABLE "PracticeMenu" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "goal" TEXT,
    "totalMinutes" INTEGER,
    "isTemplate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PracticeMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeMenuItem" (
    "id" TEXT NOT NULL,
    "practiceMenuId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "PracticeMenuCategory" NOT NULL,
    "durationMin" INTEGER,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PracticeMenuItem_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "PracticeLog" ADD COLUMN "practiceMenuId" TEXT;

-- AddForeignKey
ALTER TABLE "PracticeMenu" ADD CONSTRAINT "PracticeMenu_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeMenuItem" ADD CONSTRAINT "PracticeMenuItem_practiceMenuId_fkey" FOREIGN KEY ("practiceMenuId") REFERENCES "PracticeMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeLog" ADD CONSTRAINT "PracticeLog_practiceMenuId_fkey" FOREIGN KEY ("practiceMenuId") REFERENCES "PracticeMenu"("id") ON DELETE SET NULL ON UPDATE CASCADE;
