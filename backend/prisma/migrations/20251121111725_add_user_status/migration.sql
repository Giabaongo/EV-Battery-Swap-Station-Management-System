/*
  Warnings:

  - You are about to drop the column `respond` on the `supports` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('active', 'inactive');

-- AlterTable
ALTER TABLE "public"."supports" DROP COLUMN "respond",
ADD COLUMN     "admin_respond" TEXT;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "status" "public"."UserStatus" NOT NULL DEFAULT 'active';
