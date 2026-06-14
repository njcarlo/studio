-- NotificationPreference (Layer 3) is managed exclusively via Prisma Server
-- Actions (apps/web/src/services/notification-service.ts). Prisma connects as
-- the table-owning role and bypasses RLS, so enabling RLS with no policies
-- here is a deny-all for PostgREST/anon/authenticated, matching the lockdown
-- pattern used for WorkerAvailability, LeaveRequest, etc.

alter table public."NotificationPreference" enable row level security;
