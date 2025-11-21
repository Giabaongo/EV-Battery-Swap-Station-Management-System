/*
  Warnings:

  - You are about to drop the `SwappingStation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `batteries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `battery_service_packages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reservations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vehicles` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."batteries" DROP CONSTRAINT "batteries_station_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."reservations" DROP CONSTRAINT "reservations_battery_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."reservations" DROP CONSTRAINT "reservations_station_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."reservations" DROP CONSTRAINT "reservations_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."reservations" DROP CONSTRAINT "reservations_vehicle_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."vehicles" DROP CONSTRAINT "vehicles_battery_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."vehicles" DROP CONSTRAINT "vehicles_user_id_fkey";

-- DropTable
DROP TABLE "public"."SwappingStation";

-- DropTable
DROP TABLE "public"."batteries";

-- DropTable
DROP TABLE "public"."battery_service_packages";

-- DropTable
DROP TABLE "public"."reservations";

-- DropTable
DROP TABLE "public"."users";

-- DropTable
DROP TABLE "public"."vehicles";

-- DropEnum
DROP TYPE "public"."BatteryStatus";

-- DropEnum
DROP TYPE "public"."ReservationStatus";

-- DropEnum
DROP TYPE "public"."Role";

-- DropEnum
DROP TYPE "public"."StationStatus";

-- DropEnum
DROP TYPE "public"."VehicleStatus";
