-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('active', 'expired', 'cancelled');

-- CreateTable
CREATE TABLE "public"."subscriptions" (
    "subscription_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "package_id" INTEGER NOT NULL,
    "vehicle_id" INTEGER,
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "public"."SubscriptionStatus" NOT NULL,
    "swap_used" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("subscription_id")
);

-- AddForeignKey
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."battery_service_packages"("package_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("vehicle_id") ON DELETE SET NULL ON UPDATE CASCADE;
