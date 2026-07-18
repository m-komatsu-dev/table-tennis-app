CREATE TABLE "MobileOAuthFlow" (
  "id" TEXT NOT NULL,
  "stateHash" TEXT NOT NULL,
  "codeChallenge" TEXT NOT NULL,
  "codeHash" TEXT,
  "userId" TEXT,
  "legalConsent" BOOLEAN NOT NULL DEFAULT false,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MobileOAuthFlow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MobileOAuthFlow_stateHash_key" ON "MobileOAuthFlow"("stateHash");
CREATE UNIQUE INDEX "MobileOAuthFlow_codeHash_key" ON "MobileOAuthFlow"("codeHash");
CREATE INDEX "MobileOAuthFlow_expiresAt_idx" ON "MobileOAuthFlow"("expiresAt");
CREATE INDEX "MobileOAuthFlow_userId_createdAt_idx" ON "MobileOAuthFlow"("userId", "createdAt");

ALTER TABLE "MobileOAuthFlow" ADD CONSTRAINT "MobileOAuthFlow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
