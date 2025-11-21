/*
  Warnings:

  - You are about to drop the `changing_stations` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."ReservationStatus" AS ENUM ('scheduled', 'completed', 'cancelled');

-- DropTable
DROP TABLE "public"."changing_stations";

-- CreateTable
CREATE TABLE "public"."reservations" (
    "reservation_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "battery_id" INTEGER NOT NULL,
    "station_id" INTEGER NOT NULL,
    "scheduled_time" TIMESTAMP(3) NOT NULL,
    "status" "public"."ReservationStatus" NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("reservation_id")
);

-- AddForeignKey
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_battery_id_fkey" FOREIGN KEY ("battery_id") REFERENCES "public"."batteries"("battery_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "public"."SwappingStation"("station_id") ON DELETE RESTRICT ON UPDATE CASCADE;
