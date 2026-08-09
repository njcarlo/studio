-- Pipeline transition timestamps, so coordinator turnaround is measured rather
-- than estimated. Backfilled from createdAt for rows that already moved past
-- their initial state, which is the closest signal the old schema retained.

ALTER TABLE "C2SJoinRequest" ADD COLUMN IF NOT EXISTS "assignedCoordinatorAt" TIMESTAMP(3);
ALTER TABLE "C2SJoinRequest" ADD COLUMN IF NOT EXISTS "assignedMentorAt" TIMESTAMP(3);
ALTER TABLE "C2SJoinRequest" ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP(3);

UPDATE "C2SJoinRequest"
   SET "assignedCoordinatorAt" = "createdAt"
 WHERE "assignedCoordinatorId" IS NOT NULL
   AND "assignedCoordinatorAt" IS NULL;

UPDATE "C2SJoinRequest"
   SET "assignedMentorAt" = "createdAt"
 WHERE "assignedMentorId" IS NOT NULL
   AND "assignedMentorAt" IS NULL;

UPDATE "C2SJoinRequest"
   SET "acceptedAt" = "createdAt"
 WHERE "pipelineStatus" = 'Accepted'
   AND "acceptedAt" IS NULL;
