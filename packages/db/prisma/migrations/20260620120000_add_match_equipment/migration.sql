-- Match equipment is optional so existing match records remain valid.
ALTER TABLE "MatchRecord" ADD COLUMN "equipmentId" TEXT;

ALTER TABLE "MatchRecord"
  ADD CONSTRAINT "MatchRecord_equipmentId_fkey"
  FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
