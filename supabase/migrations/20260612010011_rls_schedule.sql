-- RLS for schedule tables: ServiceSchedule, ServiceTemplate, TemplateRole,
-- WorshipSlot, ScheduleAssignment. SELECT is broad for any authenticated
-- worker. Most writes require schedule:manage; ScheduleAssignment also
-- allows a worker to update their own assignment row (e.g. self-confirm).

alter table public."ServiceSchedule" enable row level security;
alter table public."ServiceTemplate" enable row level security;
alter table public."TemplateRole" enable row level security;
alter table public."WorshipSlot" enable row level security;
alter table public."ScheduleAssignment" enable row level security;

-- ServiceSchedule
create policy "serviceschedule_select_authenticated" on public."ServiceSchedule"
  for select to authenticated using (true);

create policy "serviceschedule_insert_schedule_manage" on public."ServiceSchedule"
  for insert to authenticated with check (public.has_permission('schedule','manage'));

create policy "serviceschedule_update_schedule_manage" on public."ServiceSchedule"
  for update to authenticated using (public.has_permission('schedule','manage')) with check (public.has_permission('schedule','manage'));

create policy "serviceschedule_delete_schedule_manage" on public."ServiceSchedule"
  for delete to authenticated using (public.has_permission('schedule','manage'));

-- ServiceTemplate
create policy "servicetemplate_select_authenticated" on public."ServiceTemplate"
  for select to authenticated using (true);

create policy "servicetemplate_insert_schedule_manage" on public."ServiceTemplate"
  for insert to authenticated with check (public.has_permission('schedule','manage'));

create policy "servicetemplate_update_schedule_manage" on public."ServiceTemplate"
  for update to authenticated using (public.has_permission('schedule','manage')) with check (public.has_permission('schedule','manage'));

create policy "servicetemplate_delete_schedule_manage" on public."ServiceTemplate"
  for delete to authenticated using (public.has_permission('schedule','manage'));

-- TemplateRole
create policy "templaterole_select_authenticated" on public."TemplateRole"
  for select to authenticated using (true);

create policy "templaterole_insert_schedule_manage" on public."TemplateRole"
  for insert to authenticated with check (public.has_permission('schedule','manage'));

create policy "templaterole_update_schedule_manage" on public."TemplateRole"
  for update to authenticated using (public.has_permission('schedule','manage')) with check (public.has_permission('schedule','manage'));

create policy "templaterole_delete_schedule_manage" on public."TemplateRole"
  for delete to authenticated using (public.has_permission('schedule','manage'));

-- WorshipSlot
create policy "worshipslot_select_authenticated" on public."WorshipSlot"
  for select to authenticated using (true);

create policy "worshipslot_insert_schedule_manage" on public."WorshipSlot"
  for insert to authenticated with check (public.has_permission('schedule','manage'));

create policy "worshipslot_update_schedule_manage" on public."WorshipSlot"
  for update to authenticated using (public.has_permission('schedule','manage')) with check (public.has_permission('schedule','manage'));

create policy "worshipslot_delete_schedule_manage" on public."WorshipSlot"
  for delete to authenticated using (public.has_permission('schedule','manage'));

-- ScheduleAssignment
create policy "scheduleassignment_select_authenticated" on public."ScheduleAssignment"
  for select to authenticated using (true);

create policy "scheduleassignment_insert_schedule_manage" on public."ScheduleAssignment"
  for insert to authenticated with check (public.has_permission('schedule','manage'));

create policy "scheduleassignment_update_manage_or_own" on public."ScheduleAssignment"
  for update to authenticated using (
    public.has_permission('schedule','manage') or "workerId" = public.current_worker_id()
  ) with check (
    public.has_permission('schedule','manage') or "workerId" = public.current_worker_id()
  );

create policy "scheduleassignment_delete_schedule_manage" on public."ScheduleAssignment"
  for delete to authenticated using (public.has_permission('schedule','manage'));
