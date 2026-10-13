-- AlterTable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'User'
      AND column_name = 'phone'
  ) THEN
    ALTER TABLE "User" ALTER COLUMN "phone" DROP DEFAULT;
  END IF;
END $$;
