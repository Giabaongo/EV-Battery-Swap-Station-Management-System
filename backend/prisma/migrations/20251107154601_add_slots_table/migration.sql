/*
  Warnings:

  - You are about to drop the column `slot_number` on the `batteries` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."batteries" DROP COLUMN "slot_number",
ADD COLUMN     "slot_id" INTEGER,
ALTER COLUMN "current_charge" SET DEFAULT 0,
ALTER COLUMN "soh" SET DEFAULT 100;

-- CreateTable
CREATE TABLE "public"."Slot" (
    "slot_id" SERIAL NOT NULL,
    "cabinet_id" INTEGER NOT NULL,
    "slot_number" INTEGER NOT NULL,
    "is_occupied" BOOLEAN NOT NULL DEFAULT false,
    "battery_id" INTEGER,

    CONSTRAINT "Slot_pkey" PRIMARY KEY ("slot_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Slot_battery_id_key" ON "public"."Slot"("battery_id");

-- CreateIndex
CREATE UNIQUE INDEX "Slot_cabinet_id_slot_number_key" ON "public"."Slot"("cabinet_id", "slot_number");

-- AddForeignKey
ALTER TABLE "public"."Slot" ADD CONSTRAINT "Slot_cabinet_id_fkey" FOREIGN KEY ("cabinet_id") REFERENCES "public"."cabinets"("cabinet_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Slot" ADD CONSTRAINT "Slot_battery_id_fkey" FOREIGN KEY ("battery_id") REFERENCES "public"."batteries"("battery_id") ON DELETE SET NULL ON UPDATE CASCADE;
