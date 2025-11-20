/*
  Warnings:

  - A unique constraint covering the columns `[serial_number]` on the table `batteries` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `serial_number` to the `batteries` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."CabinetStatus" AS ENUM ('active', 'inactive', 'maintenance');

-- AlterTable
ALTER TABLE "public"."batteries" ADD COLUMN     "cabinet_id" INTEGER,
ADD COLUMN     "serial_number" VARCHAR(100) NOT NULL,
ADD COLUMN     "slot_number" INTEGER;

-- CreateTable
CREATE TABLE "public"."cabinets" (
    "cabinet_id" SERIAL NOT NULL,
    "station_id" INTEGER NOT NULL,
    "cabinet_name" VARCHAR(100) NOT NULL,
    "total_slots" INTEGER NOT NULL,
    "status" "public"."CabinetStatus" NOT NULL,

    CONSTRAINT "cabinets_pkey" PRIMARY KEY ("cabinet_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "batteries_serial_number_key" ON "public"."batteries"("serial_number");

-- AddForeignKey
ALTER TABLE "public"."batteries" ADD CONSTRAINT "batteries_cabinet_id_fkey" FOREIGN KEY ("cabinet_id") REFERENCES "public"."cabinets"("cabinet_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cabinets" ADD CONSTRAINT "cabinets_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("station_id") ON DELETE RESTRICT ON UPDATE CASCADE;
