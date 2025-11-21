-- CreateEnum
CREATE TYPE "public"."ConfigType" AS ENUM ('deposit', 'penalty', 'service_fee', 'swap_fee', 'late_fee', 'damage_fee', 'other');

-- CreateTable
CREATE TABLE "public"."configs" (
    "config_id" SERIAL NOT NULL,
    "type" "public"."ConfigType" NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "description" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configs_pkey" PRIMARY KEY ("config_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "configs_name_key" ON "public"."configs"("name");

-- CreateIndex
CREATE INDEX "configs_type_idx" ON "public"."configs"("type");
