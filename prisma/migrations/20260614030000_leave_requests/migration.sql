-- Leave & Request filing (SRD 5.10.4-5.10.6)

CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "newShiftStart" TEXT,
    "newShiftEnd" TEXT,
    "days" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "workflowId" TEXT,
    "balanceApplied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LeaveRequest_workflowId_key" ON "LeaveRequest"("workflowId");
CREATE INDEX "LeaveRequest_workerId_idx" ON "LeaveRequest"("workerId");

ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_workerId_fkey"
    FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "LeaveBalance" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "totalDays" DOUBLE PRECISION NOT NULL,
    "usedDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveBalance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LeaveBalance_workerId_type_year_key" ON "LeaveBalance"("workerId", "type", "year");
CREATE INDEX "LeaveBalance_workerId_idx" ON "LeaveBalance"("workerId");

ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_workerId_fkey"
    FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
