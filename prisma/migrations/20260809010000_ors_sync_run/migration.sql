-- Durable ORS sync run history: start/finish timestamps plus a running flag,
-- so the ORS sync page can answer "is a sync in progress right now?" without
-- relying on a client-side boolean that dies with the browser tab.
CREATE TABLE "OrsSyncRun" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "succeeded" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "message" TEXT,
    "startedById" TEXT,
    "startedByName" TEXT,

    CONSTRAINT "OrsSyncRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrsSyncRun_startedAt_idx" ON "OrsSyncRun"("startedAt");
CREATE INDEX "OrsSyncRun_status_startedAt_idx" ON "OrsSyncRun"("status", "startedAt");
CREATE INDEX "OrsSyncRun_scope_startedAt_idx" ON "OrsSyncRun"("scope", "startedAt");
