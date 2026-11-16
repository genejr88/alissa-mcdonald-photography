-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "squareOrderId" TEXT;
ALTER TABLE "Booking" ADD COLUMN "squarePaymentLinkUrl" TEXT;
ALTER TABLE "Booking" ADD COLUMN "squarePaymentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Booking_squareOrderId_key" ON "Booking"("squareOrderId");
