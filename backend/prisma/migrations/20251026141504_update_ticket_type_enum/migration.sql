/*
  Warnings:

  - Changed the type of `ticket_type` on the `battery_transfer_tickets` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."TicketType" AS ENUM ('import', 'export');

-- AlterTable
ALTER TABLE "public"."battery_transfer_tickets" DROP COLUMN "ticket_type",
ADD COLUMN     "ticket_type" "public"."TicketType" NOT NULL;

-- DropEnum
DROP TYPE "public"."ticket_type";
