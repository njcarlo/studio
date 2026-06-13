-- Tables only ever accessed via Prisma (apps/web Server Actions), never via
-- PostgREST/edge functions. Enable RLS with no policies: this is a deny-all
-- for `anon`/`authenticated` over PostgREST, but has zero effect on Prisma,
-- which connects as the table-owning role and bypasses RLS by default.

alter table public."Setting" enable row level security;
alter table public."DepartmentSetting" enable row level security;
alter table public."AssistanceConfiguration" enable row level security;
alter table public."AssistanceConfigItem" enable row level security;
alter table public."AssistanceRequestItem" enable row level security;
alter table public."VenueAuditLog" enable row level security;
alter table public."VenueAssistanceSetting" enable row level security;
alter table public."InAppNotification" enable row level security;
alter table public."WorshipSlotWorker" enable row level security;
alter table public."ChurchEvent" enable row level security;
alter table public."EventRoomBooking" enable row level security;
alter table public."EventAssignment" enable row level security;
alter table public."EventEquipment" enable row level security;
