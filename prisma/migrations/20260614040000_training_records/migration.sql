-- Training Management (SRD 5.9)

CREATE TABLE "TrainingRecord" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dateCompleted" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Completed',
    "notes" TEXT,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TrainingRecord_workerId_idx" ON "TrainingRecord"("workerId");

ALTER TABLE "TrainingRecord" ADD CONSTRAINT "TrainingRecord_workerId_fkey"
    FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
