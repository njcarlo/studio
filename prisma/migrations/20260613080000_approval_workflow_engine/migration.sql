-- Layer 2: Generic Approval Workflow engine.
-- Reusable multi-stage approval state machine, shared by Room Reservation,
-- Major Event Requests, Leave/Request filing, Minor Ministry assignment, etc.
-- See apps/web/src/services/approval-engine.ts.

CREATE TABLE "ApprovalWorkflow" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalWorkflow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApprovalStage" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "stageOrder" INTEGER NOT NULL,
    "parallelGroup" INTEGER,
    "approverSpec" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3),
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalStage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ApprovalWorkflow_type_subjectId_idx" ON "ApprovalWorkflow"("type", "subjectId");

CREATE INDEX "ApprovalWorkflow_requesterId_idx" ON "ApprovalWorkflow"("requesterId");

CREATE INDEX "ApprovalStage_workflowId_status_idx" ON "ApprovalStage"("workflowId", "status");

ALTER TABLE "ApprovalStage" ADD CONSTRAINT "ApprovalStage_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "ApprovalWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
