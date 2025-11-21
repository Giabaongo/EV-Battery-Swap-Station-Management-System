-- DropForeignKey
ALTER TABLE "public"."vehicles" DROP CONSTRAINT "vehicles_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."vehicles" ALTER COLUMN "user_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."vehicles" ADD CONSTRAINT "vehicles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
