-- CreateTable
CREATE TABLE "TimeRequest" (
    "id" TEXT NOT NULL,
    "serviceName" TEXT,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "clientPhone" TEXT,
    "preferredDate" TEXT,
    "requestedTime" TEXT NOT NULL,
    "notes" TEXT,
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeRequest_pkey" PRIMARY KEY ("id")
);
