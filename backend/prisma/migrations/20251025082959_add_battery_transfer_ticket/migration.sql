-- CreateEnum
CREATE TYPE "public"."ticket_type" AS ENUM ('import', 'export');

-- CreateTable
CREATE TABLE "public"."battery_transfer_tickets" (
    "ticket_id" SERIAL NOT NULL,
    "transfer_request_id" INTEGER NOT NULL,
    "ticket_type" "public"."ticket_type" NOT NULL,
    "station_id" INTEGER NOT NULL,
    "staff_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "battery_transfer_tickets_pkey" PRIMARY KEY ("ticket_id")
);

-- AddForeignKey
ALTER TABLE "public"."battery_transfer_tickets" ADD CONSTRAINT "battery_transfer_tickets_transfer_request_id_fkey" FOREIGN KEY ("transfer_request_id") REFERENCES "public"."battery_transfer_requests"("transfer_request_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."battery_transfer_tickets" ADD CONSTRAINT "battery_transfer_tickets_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("station_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."battery_transfer_tickets" ADD CONSTRAINT "battery_transfer_tickets_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
