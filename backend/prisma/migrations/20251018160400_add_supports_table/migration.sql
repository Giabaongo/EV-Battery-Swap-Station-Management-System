-- CreateEnum
CREATE TYPE "public"."SupportType" AS ENUM ('battery_issue', 'station_issue', 'other');

-- CreateEnum
CREATE TYPE "public"."SupportStatus" AS ENUM ('open', 'in_progress', 'closed');

-- CreateTable
CREATE TABLE "public"."supports" (
    "support_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "station_id" INTEGER,
    "type" "public"."SupportType" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "public"."SupportStatus" NOT NULL DEFAULT 'open',
    "rating" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supports_pkey" PRIMARY KEY ("support_id")
);

-- AddForeignKey
ALTER TABLE "public"."supports" ADD CONSTRAINT "supports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supports" ADD CONSTRAINT "supports_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("station_id") ON DELETE SET NULL ON UPDATE CASCADE;
