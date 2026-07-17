CREATE TYPE "FeedbackCategory" AS ENUM ('BUG', 'USABILITY', 'FEATURE_REQUEST', 'SAFETY', 'OTHER');

CREATE TYPE "FeedbackStatus" AS ENUM ('OPEN', 'REVIEWING', 'RESOLVED', 'CLOSED');

CREATE TYPE "FeedbackPlatform" AS ENUM ('WEB', 'MOBILE');

CREATE TABLE "Feedback" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "category" "FeedbackCategory" NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "platform" "FeedbackPlatform" NOT NULL,
  "sourcePath" TEXT,
  "status" "FeedbackStatus" NOT NULL DEFAULT 'OPEN',
  "adminNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Feedback_userId_createdAt_idx" ON "Feedback"("userId", "createdAt");

CREATE INDEX "Feedback_status_createdAt_idx" ON "Feedback"("status", "createdAt");

CREATE INDEX "Feedback_category_createdAt_idx" ON "Feedback"("category", "createdAt");

ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON UPDATE CASCADE;
