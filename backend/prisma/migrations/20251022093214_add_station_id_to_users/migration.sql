-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "station_id" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("station_id") ON DELETE SET NULL ON UPDATE CASCADE;
