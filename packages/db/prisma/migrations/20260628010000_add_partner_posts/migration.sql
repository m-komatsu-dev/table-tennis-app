CREATE TYPE "PartnerPostType" AS ENUM ('PRACTICE', 'MATCH');

CREATE TYPE "PartnerPostStatus" AS ENUM ('OPEN', 'CLOSED');

CREATE TYPE "PartnerRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

CREATE TABLE "PartnerPost" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "type" "PartnerPostType" NOT NULL,
  "title" TEXT NOT NULL,
  "area" TEXT,
  "preferredTime" TEXT,
  "level" TEXT,
  "purpose" TEXT,
  "message" TEXT,
  "status" "PartnerPostStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PartnerPost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PartnerRequest" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "requesterId" TEXT NOT NULL,
  "message" TEXT,
  "status" "PartnerRequestStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PartnerRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PartnerPost_status_createdAt_idx" ON "PartnerPost"("status", "createdAt");
CREATE INDEX "PartnerPost_ownerId_createdAt_idx" ON "PartnerPost"("ownerId", "createdAt");
CREATE UNIQUE INDEX "PartnerRequest_postId_requesterId_key" ON "PartnerRequest"("postId", "requesterId");
CREATE INDEX "PartnerRequest_requesterId_createdAt_idx" ON "PartnerRequest"("requesterId", "createdAt");

ALTER TABLE "PartnerPost" ADD CONSTRAINT "PartnerPost_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartnerRequest" ADD CONSTRAINT "PartnerRequest_postId_fkey" FOREIGN KEY ("postId") REFERENCES "PartnerPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartnerRequest" ADD CONSTRAINT "PartnerRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
