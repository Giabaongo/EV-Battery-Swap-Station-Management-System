/*
  Warnings:

  - Added the required column `vehicle_id` to the `reservations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."reservations" ADD COLUMN     "vehicle_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("vehicle_id") ON DELETE RESTRICT ON UPDATE CASCADE;
