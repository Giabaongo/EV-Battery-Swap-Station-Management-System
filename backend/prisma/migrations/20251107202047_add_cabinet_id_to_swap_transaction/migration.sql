-- -- AlterTable
-- ALTER TABLE "public"."swap_transactions" ADD COLUMN     "cabinetCabinet_id" INTEGER;

-- -- AddForeignKey
-- ALTER TABLE "public"."swap_transactions" ADD CONSTRAINT "swap_transactions_cabinetCabinet_id_fkey" FOREIGN KEY ("cabinetCabinet_id") REFERENCES "public"."cabinets"("cabinet_id") ON DELETE SET NULL ON UPDATE CASCADE;
