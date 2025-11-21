-- AlterEnum
ALTER TYPE "public"."ConfigType" ADD VALUE 'system';

-- AlterTable
ALTER TABLE "public"."configs" ADD COLUMN     "string_value" VARCHAR(255),
ALTER COLUMN "value" DROP NOT NULL;
