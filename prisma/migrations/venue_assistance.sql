-- Migration: venue-assistance
-- Creates all new tables for the Venue Assistance module

-- CreateTable VenueBooking
CREATE TABLE IF NOT EXISTS "VenueBooking" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "purpose" TEXT,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending Ministry Approval',
    "pax" INTEGER NOT NULL DEFAULT 0,
    "numTables" INTEGER NOT NULL DEFAULT 0,
    "numChairs" INTEGER NOT NULL DEFAULT 0,
    "guidelinesAccepted" BOOLEAN NOT NULL DEFAULT false,
    "recurringBookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VenueBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable RecurringBooking
CREATE TABLE IF NOT EXISTS "RecurringBooking" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "purpose" TEXT,
    "recurrenceRule" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "pax" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecurringBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable AssistanceConfiguration
CREATE TABLE IF NOT EXISTS "AssistanceConfiguration" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "ministryId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssistanceConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable AssistanceConfigItem
CREATE TABLE IF NOT EXISTS "AssistanceConfigItem" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "AssistanceConfigItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable AssistanceRequest
CREATE TABLE IF NOT EXISTS "AssistanceRequest" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "ministryId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "explanation" TEXT,
    "respondedAt" TIMESTAMP(3),
    "respondedBy" TEXT,
    "slaEscalatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssistanceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable AssistanceRequestItem
CREATE TABLE IF NOT EXISTS "AssistanceRequestItem" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "adjustedQty" INTEGER,
    "adjustedDesc" TEXT,
    CONSTRAINT "AssistanceRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable VenueAuditLog
CREATE TABLE IF NOT EXISTS "VenueAuditLog" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "configId" TEXT,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "triggerSource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VenueAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable VenueAssistanceSetting
CREATE TABLE IF NOT EXISTS "VenueAssistanceSetting" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "slaDays" INTEGER NOT NULL DEFAULT 3,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VenueAssistanceSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable InAppNotification
CREATE TABLE IF NOT EXISTS "InAppNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InAppNotification_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX IF NOT EXISTS "VenueBooking_requestId_key" ON "VenueBooking"("requestId");

-- CreateUniqueIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AssistanceConfiguration_roomId_ministryId_key" ON "AssistanceConfiguration"("roomId", "ministryId");

-- AddForeignKey
ALTER TABLE "VenueBooking" DROP CONSTRAINT IF EXISTS "VenueBooking_roomId_fkey";
ALTER TABLE "VenueBooking" ADD CONSTRAINT "VenueBooking_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VenueBooking" DROP CONSTRAINT IF EXISTS "VenueBooking_workerProfileId_fkey";
ALTER TABLE "VenueBooking" ADD CONSTRAINT "VenueBooking_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VenueBooking" DROP CONSTRAINT IF EXISTS "VenueBooking_recurringBookingId_fkey";
ALTER TABLE "VenueBooking" ADD CONSTRAINT "VenueBooking_recurringBookingId_fkey" FOREIGN KEY ("recurringBookingId") REFERENCES "RecurringBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AssistanceConfiguration" DROP CONSTRAINT IF EXISTS "AssistanceConfiguration_roomId_fkey";
ALTER TABLE "AssistanceConfiguration" ADD CONSTRAINT "AssistanceConfiguration_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AssistanceConfigItem" DROP CONSTRAINT IF EXISTS "AssistanceConfigItem_configId_fkey";
ALTER TABLE "AssistanceConfigItem" ADD CONSTRAINT "AssistanceConfigItem_configId_fkey" FOREIGN KEY ("configId") REFERENCES "AssistanceConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssistanceRequest" DROP CONSTRAINT IF EXISTS "AssistanceRequest_bookingId_fkey";
ALTER TABLE "AssistanceRequest" ADD CONSTRAINT "AssistanceRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "VenueBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AssistanceRequestItem" DROP CONSTRAINT IF EXISTS "AssistanceRequestItem_requestId_fkey";
ALTER TABLE "AssistanceRequestItem" ADD CONSTRAINT "AssistanceRequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "AssistanceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VenueAuditLog" DROP CONSTRAINT IF EXISTS "VenueAuditLog_requestId_fkey";
ALTER TABLE "VenueAuditLog" ADD CONSTRAINT "VenueAuditLog_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "AssistanceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default VenueAssistanceSetting
INSERT INTO "VenueAssistanceSetting" ("id", "slaDays", "updatedAt")
VALUES ('global', 3, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
