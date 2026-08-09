-- How a group meets. Separate axis from groupType (Community- vs Church-based),
-- and the source of the face-to-face vs online split on the shared dashboard.
ALTER TABLE "C2SGroup" ADD COLUMN "meetingMode" TEXT NOT NULL DEFAULT 'F2F';
