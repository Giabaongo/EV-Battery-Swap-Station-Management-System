/*
  Warnings:

  - A unique constraint covering the columns `[vnp_txn_ref]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."PaymentMethod" ADD VALUE 'vnpay';
ALTER TYPE "public"."PaymentMethod" ADD VALUE 'momo';
ALTER TYPE "public"."PaymentMethod" ADD VALUE 'zalopay';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."PaymentStatus" ADD VALUE 'success';
ALTER TYPE "public"."PaymentStatus" ADD VALUE 'cancelled';

-- AlterTable
ALTER TABLE "public"."payments" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "order_info" VARCHAR(255),
ADD COLUMN     "package_id" INTEGER,
ADD COLUMN     "subscription_id" INTEGER,
ADD COLUMN     "transaction_id" VARCHAR(100),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "vnp_bank_code" VARCHAR(50),
ADD COLUMN     "vnp_card_type" VARCHAR(50),
ADD COLUMN     "vnp_response_code" VARCHAR(10),
ADD COLUMN     "vnp_txn_ref" VARCHAR(100),
ALTER COLUMN "payment_time" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "payments_vnp_txn_ref_key" ON "public"."payments"("vnp_txn_ref");

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("subscription_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."battery_service_packages"("package_id") ON DELETE SET NULL ON UPDATE CASCADE;
