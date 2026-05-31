-- Events Management tables
-- Safe: only creates new tables, no drops or alterations

CREATE TABLE IF NOT EXISTS "ChurchEvent" (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title        TEXT NOT NULL,
  description  TEXT,
  date         TIMESTAMPTZ NOT NULL,
  "endDate"    TIMESTAMPTZ,
  "startTime"  TEXT,
  "endTime"    TEXT,
  location     TEXT,
  status       TEXT NOT NULL DEFAULT 'Planning',
  "createdBy"  TEXT NOT NULL,
  notes        TEXT,
  "scheduleId" TEXT,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "EventRoomBooking" (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "eventId"   TEXT NOT NULL REFERENCES "ChurchEvent"(id) ON DELETE CASCADE,
  "roomId"    TEXT NOT NULL REFERENCES "Room"(id),
  "startTime" TEXT NOT NULL,
  "endTime"   TEXT NOT NULL,
  purpose     TEXT,
  notes       TEXT
);

CREATE TABLE IF NOT EXISTS "EventAssignment" (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "eventId"    TEXT NOT NULL REFERENCES "ChurchEvent"(id) ON DELETE CASCADE,
  "ministryId" TEXT NOT NULL,
  "roleName"   TEXT NOT NULL,
  "workerId"   TEXT,
  "workerName" TEXT,
  notes        TEXT,
  "order"      INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "EventEquipment" (
  id        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "eventId" TEXT NOT NULL REFERENCES "ChurchEvent"(id) ON DELETE CASCADE,
  "itemId"  TEXT NOT NULL REFERENCES "InventoryItem"(id),
  quantity  INT NOT NULL DEFAULT 1,
  notes     TEXT
);

CREATE INDEX IF NOT EXISTS "ChurchEvent_date_idx"           ON "ChurchEvent"(date);
CREATE INDEX IF NOT EXISTS "ChurchEvent_status_idx"         ON "ChurchEvent"(status);
CREATE INDEX IF NOT EXISTS "EventRoomBooking_eventId_idx"   ON "EventRoomBooking"("eventId");
CREATE INDEX IF NOT EXISTS "EventRoomBooking_roomId_idx"    ON "EventRoomBooking"("roomId");
CREATE INDEX IF NOT EXISTS "EventAssignment_eventId_idx"    ON "EventAssignment"("eventId");
CREATE INDEX IF NOT EXISTS "EventAssignment_ministryId_idx" ON "EventAssignment"("ministryId");
CREATE INDEX IF NOT EXISTS "EventEquipment_eventId_idx"     ON "EventEquipment"("eventId");
