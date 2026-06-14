-- Leave & Request tables (SRD 5.10.4-5.10.6) are managed exclusively via
-- Prisma Server Actions (apps/web/src/services/leave-workflow.ts). Prisma
-- connects as the table-owning role and bypasses RLS, so enabling RLS with
-- no policies here is a deny-all for PostgREST/anon/authenticated, matching
-- the lockdown pattern used for MasterSchedule, DepartmentSetting, etc.

alter table public."LeaveRequest" enable row level security;
alter table public."LeaveBalance" enable row level security;
