-- RoomDisplayDevice is managed exclusively via Prisma Server Actions
-- (apps/web/src/actions/db.ts): admin CRUD in Settings > Rooms > Displays,
-- and the kiosk's token -> room lookup. Prisma connects as the
-- table-owning role and bypasses RLS, so enabling RLS with no policies here
-- is a deny-all for PostgREST/anon/authenticated, matching the lockdown
-- pattern used for DepartmentSetting, AssistanceConfiguration, etc.

alter table public."RoomDisplayDevice" enable row level security;
