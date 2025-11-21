-- CreateEnum
CREATE TYPE "public"."BatteryStatus" AS ENUM ('full', 'charging', 'booked', 'defective');

-- CreateEnum
CREATE TYPE "public"."ReservationStatus" AS ENUM ('scheduled', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."StationStatus" AS ENUM ('active', 'inactive', 'maintenance');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('driver', 'station_staff', 'admin');

-- CreateEnum
CREATE TYPE "public"."VehicleStatus" AS ENUM ('active', 'inactive');

-- CreateTable
CREATE TABLE "public"."batteries" (
    "battery_id" SERIAL NOT NULL,
    "vehicle_id" INTEGER,
    "station_id" INTEGER,
    "model" VARCHAR(100) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "capacity" DECIMAL(5,2) NOT NULL,
    "current_charge" DECIMAL(5,2) NOT NULL,
    "soh" DECIMAL(5,2) NOT NULL,
    "status" "public"."BatteryStatus" NOT NULL,

    CONSTRAINT "batteries_pkey" PRIMARY KEY ("battery_id")
);

-- CreateTable
CREATE TABLE "public"."battery_service_packages" (
    "package_id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "base_distance" INTEGER NOT NULL,
    "base_price" DECIMAL(12,2) NOT NULL,
    "swap_count" INTEGER NOT NULL,
    "penalty_fee" INTEGER NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "description" VARCHAR(255),
    "active" BOOLEAN NOT NULL,

    CONSTRAINT "battery_service_packages_pkey" PRIMARY KEY ("package_id")
);

-- CreateTable
CREATE TABLE "public"."reservations" (
    "reservation_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    "battery_id" INTEGER NOT NULL,
    "station_id" INTEGER NOT NULL,
    "scheduled_time" TIMESTAMP(3) NOT NULL,
    "status" "public"."ReservationStatus" NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("reservation_id")
);

-- CreateTable
CREATE TABLE "public"."SwappingStation" (
    "station_id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "status" "public"."StationStatus" NOT NULL,

    CONSTRAINT "SwappingStation_pkey" PRIMARY KEY ("station_id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "user_id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."vehicles" (
    "vehicle_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "battery_id" INTEGER,
    "vin" VARCHAR(50) NOT NULL,
    "battery_model" VARCHAR(50) NOT NULL,
    "battery_type" VARCHAR(50) NOT NULL,
    "status" "public"."VehicleStatus" NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("vehicle_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "batteries_vehicle_id_key" ON "public"."batteries"("vehicle_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "public"."users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_battery_id_key" ON "public"."vehicles"("battery_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vin_key" ON "public"."vehicles"("vin");

-- AddForeignKey
ALTER TABLE "public"."batteries" ADD CONSTRAINT "batteries_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "public"."SwappingStation"("station_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("vehicle_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_battery_id_fkey" FOREIGN KEY ("battery_id") REFERENCES "public"."batteries"("battery_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "public"."SwappingStation"("station_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicles" ADD CONSTRAINT "vehicles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicles" ADD CONSTRAINT "vehicles_battery_id_fkey" FOREIGN KEY ("battery_id") REFERENCES "public"."batteries"("battery_id") ON DELETE SET NULL ON UPDATE CASCADE;
