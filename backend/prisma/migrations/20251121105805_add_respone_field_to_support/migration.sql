-- AlterTable
ALTER TABLE "public"."supports" ADD COLUMN     "respond" TEXT,
ALTER COLUMN "description" DROP NOT NULL;
