/*
  Warnings:

  - You are about to drop the column `Status` on the `battery_transfer_requests` table. All the data in the column will be lost.
  - You are about to drop the column `amount_batteries` on the `battery_transfer_requests` table. All the data in the column will be lost.
  - Added the required column `quantity` to the `battery_transfer_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."battery_transfer_requests" DROP COLUMN "Status",
DROP COLUMN "amount_batteries",
ADD COLUMN     "quantity" INTEGER NOT NULL,
ADD COLUMN     "status" "public"."TransferStatus" NOT NULL DEFAULT 'in_progress';

-- CreateTable
CREATE TABLE "public"."batteries_transfer" (
    "ticket_id" INTEGER NOT NULL,
    "battery_id" INTEGER NOT NULL,

    CONSTRAINT "batteries_transfer_pkey" PRIMARY KEY ("ticket_id","battery_id")
);

-- AddForeignKey
ALTER TABLE "public"."batteries_transfer" ADD CONSTRAINT "batteries_transfer_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."battery_transfer_tickets"("ticket_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."batteries_transfer" ADD CONSTRAINT "batteries_transfer_battery_id_fkey" FOREIGN KEY ("battery_id") REFERENCES "public"."batteries"("battery_id") ON DELETE RESTRICT ON UPDATE CASCADE;
