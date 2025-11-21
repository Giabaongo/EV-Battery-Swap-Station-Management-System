/*
  Warnings:

  - You are about to drop the column `transaction_time` on the `swap_transactions` table. All the data in the column will be lost.
  - Added the required column `updateAt` to the `swap_transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."swap_transactions" DROP COLUMN "transaction_time",
ADD COLUMN     "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updateAt" TIMESTAMP(3) NOT NULL;
