-- Indexes for schedule module performance

-- getMonthlyDutyCounts: DATE_TRUNC('month', ss.date) range scan
CREATE INDEX IF NOT EXISTS idx_service_schedule_date
    ON "ServiceSchedule" (date);

-- getMonthlyDutyCounts + getWorkerConflicts: JOIN + GROUP BY on workerId
CREATE INDEX IF NOT EXISTS idx_schedule_assignment_worker_id
    ON "ScheduleAssignment" ("workerId")
    WHERE "workerId" IS NOT NULL;

-- getServiceSchedule: assignments ordered by ministryId + order
CREATE INDEX IF NOT EXISTS idx_schedule_assignment_schedule_ministry
    ON "ScheduleAssignment" ("scheduleId", "ministryId", "order");
