-- AlterTable
ALTER TABLE "User" ADD COLUMN "mailImapHost" TEXT;
ALTER TABLE "User" ADD COLUMN "mailImapPort" INTEGER;
ALTER TABLE "User" ADD COLUMN "mailUser" TEXT;
ALTER TABLE "User" ADD COLUMN "mailPassEnc" TEXT;
ALTER TABLE "User" ADD COLUMN "mailFromName" TEXT;
ALTER TABLE "User" ADD COLUMN "mailSignature" TEXT;
