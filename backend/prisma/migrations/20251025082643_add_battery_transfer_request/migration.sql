-- CreateEnum
CREATE TYPE "public"."TransferStatus" AS ENUM ('completed', 'in_progress', 'cancelled');

-- CreateTable
CREATE TABLE "public"."battery_transfer_requests" (
    "transfer_request_id" SERIAL NOT NULL,
    "battery_model" VARCHAR(100) NOT NULL,
    "battery_type" VARCHAR(50) NOT NULL,
    "amount_batteries" INTEGER NOT NULL,
    "from_station_id" INTEGER NOT NULL,
    "to_station_id" INTEGER NOT NULL,
    "Status" "public"."TransferStatus" NOT NULL DEFAULT 'in_progress',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "battery_transfer_requests_pkey" PRIMARY KEY ("transfer_request_id")
);

-- AddForeignKey
ALTER TABLE "public"."battery_transfer_requests" ADD CONSTRAINT "battery_transfer_requests_from_station_id_fkey" FOREIGN KEY ("from_station_id") REFERENCES "public"."stations"("station_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."battery_transfer_requests" ADD CONSTRAINT "battery_transfer_requests_to_station_id_fkey" FOREIGN KEY ("to_station_id") REFERENCES "public"."stations"("station_id") ON DELETE RESTRICT ON UPDATE CASCADE;
