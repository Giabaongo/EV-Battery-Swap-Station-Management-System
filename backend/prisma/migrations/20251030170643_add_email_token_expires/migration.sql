-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "email_token" TEXT,
ADD COLUMN     "email_token_expires" TIMESTAMP(3),
ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false;
