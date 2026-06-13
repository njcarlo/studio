-- Master Schedule / late-flagging tables (SRD 5.10.1, 5.10.3) are managed
-- exclusively via Prisma Server Actions (apps/web/src/services/master-schedule.ts).
-- Prisma connects as the table-owning role and bypasses RLS, so enabling RLS
-- with no policies here is a deny-all for PostgREST/anon/authenticated,
-- matching the lockdown pattern used for DepartmentSetting, MajorEventSetting, etc.

alter table public."MasterSchedule" enable row level security;
alter table public."MasterScheduleOverride" enable row level security;
alter table public."AttendanceSetting" enable row level security;
