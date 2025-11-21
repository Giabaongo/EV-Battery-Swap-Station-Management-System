/*
  Warnings:

  - Added the required column `cabinet_id` to the `swap_transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."swap_transactions" ADD COLUMN     "cabinet_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."swap_transactions" ADD CONSTRAINT "swap_transactions_cabinet_id_fkey" FOREIGN KEY ("cabinet_id") REFERENCES "public"."cabinets"("cabinet_id") ON DELETE RESTRICT ON UPDATE CASCADE;
