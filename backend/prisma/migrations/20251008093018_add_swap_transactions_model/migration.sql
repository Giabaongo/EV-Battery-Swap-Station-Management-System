/*
  Warnings:

  - You are about to drop the `Station` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."SwapTransactionStatus" AS ENUM ('completed', 'pending', 'cancelled');

-- DropForeignKey
ALTER TABLE "public"."batteries" DROP CONSTRAINT "batteries_station_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."reservations" DROP CONSTRAINT "reservations_station_id_fkey";

-- DropTable
DROP TABLE "public"."Station";

-- CreateTable
CREATE TABLE "public"."stations" (
    "station_id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "status" "public"."StationStatus" NOT NULL,

    CONSTRAINT "stations_pkey" PRIMARY KEY ("station_id")
);

-- CreateTable
CREATE TABLE "public"."swap_transactions" (
    "transaction_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    "station_id" INTEGER NOT NULL,
    "battery_taken_id" INTEGER NOT NULL,
    "battery_returned_id" INTEGER,
    "swap_time" TIMESTAMP(3) NOT NULL,
    "status" "public"."SwapTransactionStatus" NOT NULL,

    CONSTRAINT "swap_transactions_pkey" PRIMARY KEY ("transaction_id")
);

-- AddForeignKey
ALTER TABLE "public"."batteries" ADD CONSTRAINT "batteries_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("station_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("station_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."swap_transactions" ADD CONSTRAINT "swap_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."swap_transactions" ADD CONSTRAINT "swap_transactions_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("vehicle_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."swap_transactions" ADD CONSTRAINT "swap_transactions_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("station_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."swap_transactions" ADD CONSTRAINT "swap_transactions_battery_taken_id_fkey" FOREIGN KEY ("battery_taken_id") REFERENCES "public"."batteries"("battery_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."swap_transactions" ADD CONSTRAINT "swap_transactions_battery_returned_id_fkey" FOREIGN KEY ("battery_returned_id") REFERENCES "public"."batteries"("battery_id") ON DELETE SET NULL ON UPDATE CASCADE;
