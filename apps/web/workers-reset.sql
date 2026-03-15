-- ============================================================
-- 1. Copy id into workerId for all workers where workerId is null
-- ============================================================
UPDATE "Worker"
SET "workerId" = "id"
WHERE "workerId" IS NULL;

-- ============================================================
-- 2. Set everyone to 'viewer' role EXCEPT admin@system.com
-- ============================================================
UPDATE "Worker"
SET "roleId" = 'viewer'
WHERE "email" != 'admin@system.com';

-- ============================================================
-- Verify results
-- ============================================================
SELECT "id", "workerId", "email", "roleId"
FROM "Worker"
ORDER BY "email";
