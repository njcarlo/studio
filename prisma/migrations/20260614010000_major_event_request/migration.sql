-- Phase 2 item 3: Major Event Request module (SRD 5.11).
-- Sys-Admin-managed service catalogue (grouped by providing ministry), the
-- request itself (linked to an ApprovalWorkflow via ApprovalWorkflow.subjectId,
-- matching the Booking/Room Reservation pattern), its line items (each tagged
-- with a providing ministry, driving the parallel approval stages), and a
-- global enable/disable toggle for the request button.

CREATE TABLE "MajorEventServiceCatalogItem" (
    "id" TEXT NOT NULL,
    "ministryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MajorEventServiceCatalogItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MajorEventServiceCatalogItem_ministryId_idx" ON "MajorEventServiceCatalogItem"("ministryId");

CREATE TABLE "MajorEventRequest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "location" TEXT,
    "requesterId" TEXT NOT NULL,
    "ministryId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MajorEventRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MajorEventRequest_requesterId_idx" ON "MajorEventRequest"("requesterId");
CREATE INDEX "MajorEventRequest_ministryId_idx" ON "MajorEventRequest"("ministryId");

CREATE TABLE "MajorEventRequestItem" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "catalogItemId" TEXT,
    "ministryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "quantity" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'Pending',

    CONSTRAINT "MajorEventRequestItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MajorEventRequestItem_requestId_idx" ON "MajorEventRequestItem"("requestId");
CREATE INDEX "MajorEventRequestItem_ministryId_idx" ON "MajorEventRequestItem"("ministryId");

ALTER TABLE "MajorEventRequestItem" ADD CONSTRAINT "MajorEventRequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "MajorEventRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "MajorEventSetting" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MajorEventSetting_pkey" PRIMARY KEY ("id")
);

INSERT INTO "MajorEventSetting" ("id", "enabled") VALUES ('global', true);
