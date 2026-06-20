-- Existing match records remain valid because the new field is nullable.
ALTER TABLE "MatchRecord" ADD COLUMN "opponentTeam" TEXT;
