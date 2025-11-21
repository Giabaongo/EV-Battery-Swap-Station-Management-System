/*
  Warnings:

  - You are about to drop the `SwappingStation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."batteries" DROP CONSTRAINT "batteries_station_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."reservations" DROP CONSTRAINT "reservations_station_id_fkey";

-- DropTable
DROP TABLE "public"."SwappingStation";

-- CreateTable
CREATE TABLE "public"."Station" (
    "station_id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "status" "public"."StationStatus" NOT NULL,

    CONSTRAINT "Station_pkey" PRIMARY KEY ("station_id")
);

-- AddForeignKey
ALTER TABLE "public"."batteries" ADD CONSTRAINT "batteries_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "public"."Station"("station_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "public"."Station"("station_id") ON DELETE RESTRICT ON UPDATE CASCADE;
