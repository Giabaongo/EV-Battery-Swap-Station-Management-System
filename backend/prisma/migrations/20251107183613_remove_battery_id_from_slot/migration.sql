/*
  Warnings:

  - You are about to drop the column `battery_id` on the `slots` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slot_id]` on the table `batteries` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "public"."SwapTransactionStatus" ADD VALUE 'pending';

-- DropForeignKey
ALTER TABLE "public"."slots" DROP CONSTRAINT "slots_battery_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."swap_transactions" DROP CONSTRAINT "swap_transactions_battery_taken_id_fkey";

-- DropIndex
DROP INDEX "public"."slots_battery_id_key";

-- AlterTable
ALTER TABLE "public"."slots" DROP COLUMN "battery_id";

-- AlterTable
ALTER TABLE "public"."swap_transactions" ALTER COLUMN "battery_taken_id" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "batteries_slot_id_key" ON "public"."batteries"("slot_id");

-- AddForeignKey
ALTER TABLE "public"."batteries" ADD CONSTRAINT "batteries_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "public"."slots"("slot_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."swap_transactions" ADD CONSTRAINT "swap_transactions_battery_taken_id_fkey" FOREIGN KEY ("battery_taken_id") REFERENCES "public"."batteries"("battery_id") ON DELETE SET NULL ON UPDATE CASCADE;
