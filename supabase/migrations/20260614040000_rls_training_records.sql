-- TrainingRecord (SRD 5.9) is managed exclusively via Prisma Server Actions
-- (apps/web/src/services/training.ts). Prisma connects as the table-owning
-- role and bypasses RLS, so enabling RLS with no policies here is a deny-all
-- for PostgREST/anon/authenticated, matching the lockdown pattern used for
-- LeaveRequest, MasterSchedule, DepartmentSetting, etc.

alter table public."TrainingRecord" enable row level security;
