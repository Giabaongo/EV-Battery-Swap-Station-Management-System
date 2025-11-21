-- CreateEnum
CREATE TYPE "public"."PaymentType" AS ENUM ('subscription', 'subscription_with_deposit', 'battery_deposit', 'battery_replacement', 'damage_fee', 'other');

-- AlterTable
ALTER TABLE "public"."payments" ADD COLUMN     "payment_type" "public"."PaymentType" NOT NULL DEFAULT 'subscription';
