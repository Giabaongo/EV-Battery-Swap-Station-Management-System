/*
  Warnings:

  - You are about to drop the `Slot` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Slot" DROP CONSTRAINT "Slot_battery_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Slot" DROP CONSTRAINT "Slot_cabinet_id_fkey";

-- DropTable
DROP TABLE "public"."Slot";

-- CreateTable
CREATE TABLE "public"."slots" (
    "slot_id" SERIAL NOT NULL,
    "cabinet_id" INTEGER NOT NULL,
    "slot_number" INTEGER NOT NULL,
    "is_occupied" BOOLEAN NOT NULL DEFAULT false,
    "battery_id" INTEGER,

    CONSTRAINT "slots_pkey" PRIMARY KEY ("slot_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "slots_battery_id_key" ON "public"."slots"("battery_id");

-- CreateIndex
CREATE UNIQUE INDEX "slots_cabinet_id_slot_number_key" ON "public"."slots"("cabinet_id", "slot_number");

-- AddForeignKey
ALTER TABLE "public"."slots" ADD CONSTRAINT "slots_cabinet_id_fkey" FOREIGN KEY ("cabinet_id") REFERENCES "public"."cabinets"("cabinet_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."slots" ADD CONSTRAINT "slots_battery_id_fkey" FOREIGN KEY ("battery_id") REFERENCES "public"."batteries"("battery_id") ON DELETE SET NULL ON UPDATE CASCADE;
