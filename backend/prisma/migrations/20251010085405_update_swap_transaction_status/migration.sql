/*
  Warnings:

  - The values [pending] on the enum `SwapTransactionStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."SwapTransactionStatus_new" AS ENUM ('completed', 'failed', 'cancelled');
ALTER TABLE "public"."swap_transactions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."swap_transactions" ALTER COLUMN "status" TYPE "public"."SwapTransactionStatus_new" USING ("status"::text::"public"."SwapTransactionStatus_new");
ALTER TYPE "public"."SwapTransactionStatus" RENAME TO "SwapTransactionStatus_old";
ALTER TYPE "public"."SwapTransactionStatus_new" RENAME TO "SwapTransactionStatus";
DROP TYPE "public"."SwapTransactionStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."swap_transactions" ALTER COLUMN "status" DROP DEFAULT;
