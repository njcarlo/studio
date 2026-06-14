-- Phase 4.1 — C2S mentor features (5.12): mentor-editable group profile
-- (location/meeting schedule/current module), anonymous join requests, and
-- per-session attendance tracking.

-- C2SGroup: mentor-editable profile fields
alter table public."C2SGroup"
  add column if not exists "location" text,
  add column if not exists "meetingSchedule" text,
  add column if not exists "currentModule" text,
  add column if not exists "updatedAt" timestamptz not null default now();

-- C2SJoinRequest
create table if not exists public."C2SJoinRequest" (
  id          text primary key default gen_random_uuid()::text,
  "groupId"   text not null references public."C2SGroup"(id),
  "firstName" text not null,
  "lastName"  text not null,
  email       text not null,
  phone       text,
  message     text,
  status      text not null default 'Pending',
  "workflowId" text,
  "createdAt" timestamptz not null default now()
);

-- C2SSession
create table if not exists public."C2SSession" (
  id          text primary key default gen_random_uuid()::text,
  "groupId"   text not null references public."C2SGroup"(id),
  date        timestamptz not null,
  module      text,
  notes       text,
  "createdBy" text not null,
  "createdAt" timestamptz not null default now()
);

-- C2SAttendanceRecord
create table if not exists public."C2SAttendanceRecord" (
  id          text primary key default gen_random_uuid()::text,
  "sessionId" text not null references public."C2SSession"(id) on delete cascade,
  "menteeId"  text not null,
  present     boolean not null default true,
  "createdAt" timestamptz not null default now(),
  unique ("sessionId", "menteeId")
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public."C2SJoinRequest" enable row level security;
alter table public."C2SSession" enable row level security;
alter table public."C2SAttendanceRecord" enable row level security;

-- C2SGroup: allow mentors to update their own group's profile fields, in
-- addition to the existing mentorship:manage policy (20260612010010).
create policy "c2sgroup_update_own_mentor" on public."C2SGroup"
  for update to authenticated
  using ("mentorId" = public.current_worker_id())
  with check ("mentorId" = public.current_worker_id());

-- C2SJoinRequest: anyone can submit a join request (anonymous public form);
-- select/update restricted to the group's mentor or mentorship:manage.
create policy "c2sjoinrequest_insert_anyone" on public."C2SJoinRequest"
  for insert to anon, authenticated with check (true);

create policy "c2sjoinrequest_select_mentor" on public."C2SJoinRequest"
  for select to authenticated using (
    public.has_permission('mentorship','manage')
    or exists (select 1 from public."C2SGroup" g where g.id = "groupId" and g."mentorId" = public.current_worker_id())
  );

create policy "c2sjoinrequest_update_mentor" on public."C2SJoinRequest"
  for update to authenticated using (
    public.has_permission('mentorship','manage')
    or exists (select 1 from public."C2SGroup" g where g.id = "groupId" and g."mentorId" = public.current_worker_id())
  );

-- C2SSession: broad select for authenticated, like C2SGroup/C2SMentee;
-- writes restricted to the group's mentor or mentorship:manage.
create policy "c2ssession_select_authenticated" on public."C2SSession"
  for select to authenticated using (true);

create policy "c2ssession_insert_mentor" on public."C2SSession"
  for insert to authenticated with check (
    public.has_permission('mentorship','manage')
    or exists (select 1 from public."C2SGroup" g where g.id = "groupId" and g."mentorId" = public.current_worker_id())
  );

create policy "c2ssession_update_mentor" on public."C2SSession"
  for update to authenticated using (
    public.has_permission('mentorship','manage')
    or exists (select 1 from public."C2SGroup" g where g.id = "groupId" and g."mentorId" = public.current_worker_id())
  );

create policy "c2ssession_delete_mentor" on public."C2SSession"
  for delete to authenticated using (
    public.has_permission('mentorship','manage')
    or exists (select 1 from public."C2SGroup" g where g.id = "groupId" and g."mentorId" = public.current_worker_id())
  );

-- C2SAttendanceRecord: same as C2SSession, scoped via the parent session's group.
create policy "c2sattendance_select_authenticated" on public."C2SAttendanceRecord"
  for select to authenticated using (true);

create policy "c2sattendance_insert_mentor" on public."C2SAttendanceRecord"
  for insert to authenticated with check (
    public.has_permission('mentorship','manage')
    or exists (
      select 1 from public."C2SSession" s
      join public."C2SGroup" g on g.id = s."groupId"
      where s.id = "sessionId" and g."mentorId" = public.current_worker_id()
    )
  );

create policy "c2sattendance_update_mentor" on public."C2SAttendanceRecord"
  for update to authenticated using (
    public.has_permission('mentorship','manage')
    or exists (
      select 1 from public."C2SSession" s
      join public."C2SGroup" g on g.id = s."groupId"
      where s.id = "sessionId" and g."mentorId" = public.current_worker_id()
    )
  );
