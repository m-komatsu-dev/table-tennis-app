-- Add the fifth profile level without renaming existing enum values.
ALTER TYPE "Level" ADD VALUE IF NOT EXISTS 'PRO';

-- Gender remains nullable so existing users continue to work unchanged.
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'NO_ANSWER');
ALTER TABLE "User" ADD COLUMN "gender" "Gender";

-- Optional equipment details used by the profile equipment editor.
ALTER TABLE "Equipment"
  ADD COLUMN "rubberFhThickness" TEXT,
  ADD COLUMN "rubberBhThickness" TEXT,
  ADD COLUMN "gripType" TEXT;
