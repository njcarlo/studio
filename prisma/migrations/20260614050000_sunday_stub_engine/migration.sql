-- Sunday Confirmation & Meal Stub Engine (SRD 5.7, 5.3.2, 5.4.1-5.4.3)

ALTER TABLE "ScheduleAssignment" ADD COLUMN "slotType" TEXT NOT NULL DEFAULT 'Standard';

CREATE TABLE "MealStubLedger" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "ministryId" TEXT,
    "departmentCode" TEXT,
    "slotType" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "costPhp" INTEGER NOT NULL,
    "scheduleId" TEXT,
    "weekOf" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MealStubLedger_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MealStubLedger_workerId_weekOf_idx" ON "MealStubLedger"("workerId", "weekOf");
CREATE INDEX "MealStubLedger_ministryId_weekOf_idx" ON "MealStubLedger"("ministryId", "weekOf");
