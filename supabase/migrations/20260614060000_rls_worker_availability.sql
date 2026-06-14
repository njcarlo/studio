-- WorkerAvailability (SRD 5.2.2) is managed exclusively via Prisma Server
-- Actions (apps/web/src/services/availability.ts). Prisma connects as the
-- table-owning role and bypasses RLS, so enabling RLS with no policies here
-- is a deny-all for PostgREST/anon/authenticated, matching the lockdown
-- pattern used for LeaveRequest, TrainingRecord, MasterSchedule, etc.

alter table public."WorkerAvailability" enable row level security;
