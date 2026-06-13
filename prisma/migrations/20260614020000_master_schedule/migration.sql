-- Phase 3.2: Master Schedule + Late Flagging (SRD 5.10.1, 5.10.3).
-- HR-editable per-worker shift schedule (shiftStart/shiftEnd/daysOff), a
-- per-date override table (written by approved ChangeTime/ChangeDayOff leave
-- requests in Phase 3.3), a global grace-period setting, and late-tracking
-- columns on AttendanceRecord.

ALTER TABLE "AttendanceRecord" ADD COLUMN "isLate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AttendanceRecord" ADD COLUMN "lateMinutes" INTEGER;

CREATE INDEX "AttendanceRecord_workerProfileId_time_idx" ON "AttendanceRecord"("workerProfileId", "time");

CREATE TABLE "MasterSchedule" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "shiftStart" TEXT NOT NULL,
    "shiftEnd" TEXT NOT NULL,
    "daysOff" INTEGER[] NOT NULL DEFAULT ARRAY[0]::INTEGER[],
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterSchedule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MasterSchedule_workerId_key" ON "MasterSchedule"("workerId");

ALTER TABLE "MasterSchedule" ADD CONSTRAINT "MasterSchedule_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "MasterScheduleOverride" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "shiftStart" TEXT,
    "shiftEnd" TEXT,
    "isDayOff" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MasterScheduleOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MasterScheduleOverride_workerId_date_key" ON "MasterScheduleOverride"("workerId", "date");
CREATE INDEX "MasterScheduleOverride_workerId_idx" ON "MasterScheduleOverride"("workerId");

ALTER TABLE "MasterScheduleOverride" ADD CONSTRAINT "MasterScheduleOverride_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AttendanceSetting" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "gracePeriodMinutes" INTEGER NOT NULL DEFAULT 15,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceSetting_pkey" PRIMARY KEY ("id")
);

INSERT INTO "AttendanceSetting" ("id", "gracePeriodMinutes", "updatedAt") VALUES ('global', 15, CURRENT_TIMESTAMP);
