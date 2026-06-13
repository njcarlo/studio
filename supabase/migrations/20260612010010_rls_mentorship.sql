-- RLS for C2S mentorship tables: C2SGroup, C2SMentee. SELECT is broad for
-- any authenticated worker; all writes require mentorship:manage.

alter table public."C2SGroup" enable row level security;
alter table public."C2SMentee" enable row level security;

-- C2SGroup
create policy "c2sgroup_select_authenticated" on public."C2SGroup"
  for select to authenticated using (true);

create policy "c2sgroup_insert_mentorship_manage" on public."C2SGroup"
  for insert to authenticated with check (public.has_permission('mentorship','manage'));

create policy "c2sgroup_update_mentorship_manage" on public."C2SGroup"
  for update to authenticated using (public.has_permission('mentorship','manage')) with check (public.has_permission('mentorship','manage'));

create policy "c2sgroup_delete_mentorship_manage" on public."C2SGroup"
  for delete to authenticated using (public.has_permission('mentorship','manage'));

-- C2SMentee
create policy "c2smentee_select_authenticated" on public."C2SMentee"
  for select to authenticated using (true);

create policy "c2smentee_insert_mentorship_manage" on public."C2SMentee"
  for insert to authenticated with check (public.has_permission('mentorship','manage'));

create policy "c2smentee_update_mentorship_manage" on public."C2SMentee"
  for update to authenticated using (public.has_permission('mentorship','manage')) with check (public.has_permission('mentorship','manage'));

create policy "c2smentee_delete_mentorship_manage" on public."C2SMentee"
  for delete to authenticated using (public.has_permission('mentorship','manage'));
