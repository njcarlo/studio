-- Layer 4 (generic audit log): extend TransactionLog with before/after state
-- snapshots and a free-text reason, e.g. for approval rejections or
-- role/permission changes. See apps/web/src/lib/audit/log.ts.

ALTER TABLE "TransactionLog" ADD COLUMN "before" JSONB;
ALTER TABLE "TransactionLog" ADD COLUMN "after" JSONB;
ALTER TABLE "TransactionLog" ADD COLUMN "reason" TEXT;
