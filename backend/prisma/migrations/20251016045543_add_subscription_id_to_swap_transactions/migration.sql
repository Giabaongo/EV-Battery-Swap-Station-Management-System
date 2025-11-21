/*
  Warnings:

  - Added the required column `subscription_id` to the `swap_transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."swap_transactions" ADD COLUMN     "subscription_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."swap_transactions" ADD CONSTRAINT "swap_transactions_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("subscription_id") ON DELETE RESTRICT ON UPDATE CASCADE;
