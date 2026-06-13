-- AlterTable
-- Layer 1 (RBAC restructure): adds the columns needed to move Worker from a
-- pure multi-role model to single role + scoped permission flags.
--   - flags: team_leader, ministry_scheduler, mentor, hr, room_reservation_manager
--   - subMinistryId: scope for the team_leader flag
--   - institutionFlag: derived from employmentType (Full Time / On-call)
ALTER TABLE "Worker" ADD COLUMN "flags" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "Worker" ADD COLUMN "subMinistryId" TEXT;
ALTER TABLE "Worker" ADD COLUMN "institutionFlag" BOOLEAN NOT NULL DEFAULT false;

-- Backfill institutionFlag for existing Full-Time / On-Call workers so the
-- new column reflects current data immediately.
UPDATE "Worker"
SET "institutionFlag" = true
WHERE "employmentType" IN ('Full-Time', 'On-Call');
