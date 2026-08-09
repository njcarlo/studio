-- C2S cluster/coordinator hierarchy, discipleship profile fields and the
-- potential-mentee pipeline. Backs the four role dashboards in apps/c2s-public.

-- --- Public directory fields on the group -----------------------------------
ALTER TABLE "C2SGroup" ADD COLUMN "description" TEXT;
ALTER TABLE "C2SGroup" ADD COLUMN "barangay" TEXT;
ALTER TABLE "C2SGroup" ADD COLUMN "leaderName" TEXT;
ALTER TABLE "C2SGroup" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'Open';
ALTER TABLE "C2SGroup" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "C2SGroup" ADD COLUMN "groupType" TEXT NOT NULL DEFAULT 'Community-based';
ALTER TABLE "C2SGroup" ADD COLUMN "capacity" INTEGER NOT NULL DEFAULT 12;
ALTER TABLE "C2SGroup" ADD COLUMN "clusterId" TEXT;

-- --- Discipleship profile on the mentee --------------------------------------
ALTER TABLE "C2SMentee" ADD COLUMN "gender" TEXT;
ALTER TABLE "C2SMentee" ADD COLUMN "birthday" TIMESTAMP(3);
ALTER TABLE "C2SMentee" ADD COLUMN "socialMediaLink" TEXT;
ALTER TABLE "C2SMentee" ADD COLUMN "firstAttended" TEXT;
ALTER TABLE "C2SMentee" ADD COLUMN "connectedSince" TIMESTAMP(3);
ALTER TABLE "C2SMentee" ADD COLUMN "currentModule" TEXT;
ALTER TABLE "C2SMentee" ADD COLUMN "currentLesson" TEXT;
ALTER TABLE "C2SMentee" ADD COLUMN "progress" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "C2SMentee" ADD COLUMN "mentorNotes" TEXT;
ALTER TABLE "C2SMentee" ADD COLUMN "inactiveAt" TIMESTAMP(3);
ALTER TABLE "C2SMentee" ADD COLUMN "inactiveReason" TEXT;
ALTER TABLE "C2SMentee" ADD COLUMN "endorsedAt" TIMESTAMP(3);
ALTER TABLE "C2SMentee" ADD COLUMN "endorsedById" TEXT;

CREATE INDEX "C2SMentee_groupId_idx" ON "C2SMentee"("groupId");
CREATE INDEX "C2SMentee_mentorId_idx" ON "C2SMentee"("mentorId");

-- --- Potential-mentee pipeline on the join request ---------------------------
ALTER TABLE "C2SJoinRequest" ADD COLUMN "barangay" TEXT;
ALTER TABLE "C2SJoinRequest" ADD COLUMN "preferredGroupIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "C2SJoinRequest" ADD COLUMN "groupType" TEXT;
ALTER TABLE "C2SJoinRequest" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'From C2S Group Finder';
ALTER TABLE "C2SJoinRequest" ADD COLUMN "pipelineStatus" TEXT NOT NULL DEFAULT 'New';
ALTER TABLE "C2SJoinRequest" ADD COLUMN "assignedCoordinatorId" TEXT;
ALTER TABLE "C2SJoinRequest" ADD COLUMN "assignedMentorId" TEXT;
ALTER TABLE "C2SJoinRequest" ADD COLUMN "interviewDate" TIMESTAMP(3);
ALTER TABLE "C2SJoinRequest" ADD COLUMN "notes" TEXT;

CREATE INDEX "C2SJoinRequest_groupId_idx" ON "C2SJoinRequest"("groupId");
CREATE INDEX "C2SJoinRequest_pipelineStatus_idx" ON "C2SJoinRequest"("pipelineStatus");
CREATE INDEX "C2SJoinRequest_assignedCoordinatorId_idx" ON "C2SJoinRequest"("assignedCoordinatorId");

-- --- Trainings and devotional entries ----------------------------------------
CREATE TABLE "C2STraining" (
    "id" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "C2STraining_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "C2STraining_menteeId_idx" ON "C2STraining"("menteeId");
ALTER TABLE "C2STraining" ADD CONSTRAINT "C2STraining_menteeId_fkey"
    FOREIGN KEY ("menteeId") REFERENCES "C2SMentee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "C2SDevotionEntry" (
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
CREATE UNIQUE INDEX "C2SDevotionEntry_menteeId_date_key" ON "C2SDevotionEntry"("menteeId", "date");
CREATE INDEX "C2SDevotionEntry_menteeId_idx" ON "C2SDevotionEntry"("menteeId");
ALTER TABLE "C2SDevotionEntry" ADD CONSTRAINT "C2SDevotionEntry_menteeId_fkey"
    FOREIGN KEY ("menteeId") REFERENCES "C2SMentee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- --- Cluster hierarchy --------------------------------------------------------
CREATE TABLE "C2SCluster" (
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
CREATE UNIQUE INDEX "C2SCluster_name_key" ON "C2SCluster"("name");

CREATE TABLE "C2SCoordinatorAssignment" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "clusterId" TEXT NOT NULL,
    "barangays" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "C2SCoordinatorAssignment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "C2SCoordinatorAssignment_workerId_clusterId_key" ON "C2SCoordinatorAssignment"("workerId", "clusterId");
CREATE INDEX "C2SCoordinatorAssignment_clusterId_idx" ON "C2SCoordinatorAssignment"("clusterId");
ALTER TABLE "C2SCoordinatorAssignment" ADD CONSTRAINT "C2SCoordinatorAssignment_clusterId_fkey"
    FOREIGN KEY ("clusterId") REFERENCES "C2SCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "C2SMentorAssignment" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "clusterId" TEXT NOT NULL,
    "groupCapacity" INTEGER NOT NULL DEFAULT 12,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "dateAssigned" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "C2SMentorAssignment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "C2SMentorAssignment_workerId_clusterId_key" ON "C2SMentorAssignment"("workerId", "clusterId");
CREATE INDEX "C2SMentorAssignment_clusterId_idx" ON "C2SMentorAssignment"("clusterId");
ALTER TABLE "C2SMentorAssignment" ADD CONSTRAINT "C2SMentorAssignment_clusterId_fkey"
    FOREIGN KEY ("clusterId") REFERENCES "C2SCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "C2SGroup_clusterId_idx" ON "C2SGroup"("clusterId");
CREATE INDEX "C2SGroup_barangay_idx" ON "C2SGroup"("barangay");
ALTER TABLE "C2SGroup" ADD CONSTRAINT "C2SGroup_clusterId_fkey"
    FOREIGN KEY ("clusterId") REFERENCES "C2SCluster"("id") ON DELETE SET NULL ON UPDATE CASCADE;
