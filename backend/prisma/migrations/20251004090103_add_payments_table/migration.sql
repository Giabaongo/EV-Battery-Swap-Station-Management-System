-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('cash', 'credit_card', 'bank_transfer', 'e_wallet');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('paid', 'pending', 'failed');

-- CreateTable
CREATE TABLE "public"."payments" (
    "payment_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_time" TIMESTAMP(3) NOT NULL,
    "method" "public"."PaymentMethod" NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL,
    "invoice_url" TEXT,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("payment_id")
);

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
