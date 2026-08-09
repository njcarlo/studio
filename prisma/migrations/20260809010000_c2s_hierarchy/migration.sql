-- C2S cluster/coordinator hierarchy, discipleship profile fields and the
-- potential-mentee pipeline. Backs the four role dashboards in apps/c2s-public.

-- --- Public directory fields on the group -----------------------------------
ALTER TABLE "C2SGroup" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "C2SGroup" ADD COLUMN IF NOT EXISTS "barangay" TEXT;
ALTER TABLE "C2SGroup" ADD COLUMN IF NOT EXISTS "leaderName" TEXT;
ALTER TABLE "C2SGroup" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'Open';
ALTER TABLE "C2SGroup" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "C2SGroup" ADD COLUMN IF NOT EXISTS "groupType" TEXT NOT NULL DEFAULT 'Community-based';
ALTER TABLE "C2SGroup" ADD COLUMN IF NOT EXISTS "capacity" INTEGER NOT NULL DEFAULT 12;
ALTER TABLE "C2SGroup" ADD COLUMN IF NOT EXISTS "clusterId" TEXT;

-- --- Discipleship profile on the mentee --------------------------------------
ALTER TABLE "C2SMentee" ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE "C2SMentee" ADD COLUMN IF NOT EXISTS "birthday" TIMESTAMP(3);
ALTER TABLE "C2SMentee" ADD COLUMN IF NOT EXISTS "socialMediaLink" TEXT;
ALTER TABLE "C2SMentee" ADD COLUMN IF NOT EXISTS "firstAttended" TEXT;
ALTER TABLE "C2SMentee" ADD COLUMN IF NOT EXISTS "connectedSince" TIMESTAMP(3);
ALTER TABLE "C2SMentee" ADD COLUMN IF NOT EXISTS "currentModule" TEXT;
ALTER TABLE "C2SMentee" ADD COLUMN IF NOT EXISTS "currentLesson" TEXT;
ALTER TABLE "C2SMentee" ADD COLUMN IF NOT EXISTS "progress" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "C2SMentee" ADD COLUMN IF NOT EXISTS "mentorNotes" TEXT;
ALTER TABLE "C2SMentee" ADD COLUMN IF NOT EXISTS "inactiveAt" TIMESTAMP(3);
ALTER TABLE "C2SMentee" ADD COLUMN IF NOT EXISTS "inactiveReason" TEXT;
ALTER TABLE "C2SMentee" ADD COLUMN IF NOT EXISTS "endorsedAt" TIMESTAMP(3);
ALTER TABLE "C2SMentee" ADD COLUMN IF NOT EXISTS "endorsedById" TEXT;

CREATE INDEX IF NOT EXISTS "C2SMentee_groupId_idx" ON "C2SMentee"("groupId");
CREATE INDEX IF NOT EXISTS "C2SMentee_mentorId_idx" ON "C2SMentee"("mentorId");

-- --- Potential-mentee pipeline on the join request ---------------------------
ALTER TABLE "C2SJoinRequest" ADD COLUMN IF NOT EXISTS "barangay" TEXT;
ALTER TABLE "C2SJoinRequest" ADD COLUMN IF NOT EXISTS "preferredGroupIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "C2SJoinRequest" ADD COLUMN IF NOT EXISTS "groupType" TEXT;
ALTER TABLE "C2SJoinRequest" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'From C2S Group Finder';
ALTER TABLE "C2SJoinRequest" ADD COLUMN IF NOT EXISTS "pipelineStatus" TEXT NOT NULL DEFAULT 'New';
ALTER TABLE "C2SJoinRequest" ADD COLUMN IF NOT EXISTS "assignedCoordinatorId" TEXT;
ALTER TABLE "C2SJoinRequest" ADD COLUMN IF NOT EXISTS "assignedMentorId" TEXT;
ALTER TABLE "C2SJoinRequest" ADD COLUMN IF NOT EXISTS "interviewDate" TIMESTAMP(3);
ALTER TABLE "C2SJoinRequest" ADD COLUMN IF NOT EXISTS "notes" TEXT;

CREATE INDEX IF NOT EXISTS "C2SJoinRequest_groupId_idx" ON "C2SJoinRequest"("groupId");
CREATE INDEX IF NOT EXISTS "C2SJoinRequest_pipelineStatus_idx" ON "C2SJoinRequest"("pipelineStatus");
CREATE INDEX IF NOT EXISTS "C2SJoinRequest_assignedCoordinatorId_idx" ON "C2SJoinRequest"("assignedCoordinatorId");

-- --- Trainings and devotional entries ----------------------------------------
CREATE TABLE IF NOT EXISTS "C2STraining" (
    "id" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "C2STraining_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "C2STraining_menteeId_idx" ON "C2STraining"("menteeId");
DO $$ BEGIN
    ALTER TABLE "C2STraining" ADD CONSTRAINT "C2STraining_menteeId_fkey"
    FOREIGN KEY ("menteeId") REFERENCES "C2SMentee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "C2SDevotionEntry" (
    "id" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "module" TEXT,
    "lesson" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "C2SDevotionEntry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "C2SDevotionEntry_menteeId_date_key" ON "C2SDevotionEntry"("menteeId", "date");
CREATE INDEX IF NOT EXISTS "C2SDevotionEntry_menteeId_idx" ON "C2SDevotionEntry"("menteeId");
DO $$ BEGIN
    ALTER TABLE "C2SDevotionEntry" ADD CONSTRAINT "C2SDevotionEntry_menteeId_fkey"
    FOREIGN KEY ("menteeId") REFERENCES "C2SMentee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- --- Cluster hierarchy --------------------------------------------------------
CREATE TABLE IF NOT EXISTS "C2SCluster" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "barangays" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mapLat" DOUBLE PRECISION,
    "mapLng" DOUBLE PRECISION,
    "clusterHeadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "C2SCluster_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "C2SCluster_name_key" ON "C2SCluster"("name");

CREATE TABLE IF NOT EXISTS "C2SCoordinatorAssignment" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "clusterId" TEXT NOT NULL,
    "barangays" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "C2SCoordinatorAssignment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "C2SCoordinatorAssignment_workerId_clusterId_key" ON "C2SCoordinatorAssignment"("workerId", "clusterId");
CREATE INDEX IF NOT EXISTS "C2SCoordinatorAssignment_clusterId_idx" ON "C2SCoordinatorAssignment"("clusterId");
DO $$ BEGIN
    ALTER TABLE "C2SCoordinatorAssignment" ADD CONSTRAINT "C2SCoordinatorAssignment_clusterId_fkey"
    FOREIGN KEY ("clusterId") REFERENCES "C2SCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "C2SMentorAssignment" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "clusterId" TEXT NOT NULL,
    "groupCapacity" INTEGER NOT NULL DEFAULT 12,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "dateAssigned" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "C2SMentorAssignment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "C2SMentorAssignment_workerId_clusterId_key" ON "C2SMentorAssignment"("workerId", "clusterId");
CREATE INDEX IF NOT EXISTS "C2SMentorAssignment_clusterId_idx" ON "C2SMentorAssignment"("clusterId");
DO $$ BEGIN
    ALTER TABLE "C2SMentorAssignment" ADD CONSTRAINT "C2SMentorAssignment_clusterId_fkey"
    FOREIGN KEY ("clusterId") REFERENCES "C2SCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "C2SGroup_clusterId_idx" ON "C2SGroup"("clusterId");
CREATE INDEX IF NOT EXISTS "C2SGroup_barangay_idx" ON "C2SGroup"("barangay");
DO $$ BEGIN
    ALTER TABLE "C2SGroup" ADD CONSTRAINT "C2SGroup_clusterId_fkey"
    FOREIGN KEY ("clusterId") REFERENCES "C2SCluster"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
