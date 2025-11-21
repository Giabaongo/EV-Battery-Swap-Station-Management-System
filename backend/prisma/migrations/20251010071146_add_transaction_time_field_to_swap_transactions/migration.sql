/*
  Warnings:

  - You are about to drop the column `swap_time` on the `swap_transactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."swap_transactions" DROP COLUMN "swap_time",
ADD COLUMN     "transaction_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "status" SET DEFAULT 'pending';
