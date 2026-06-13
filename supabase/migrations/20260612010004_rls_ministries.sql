-- RLS for ministry tables: Ministry, Department, WorkloadCategory.
-- SELECT is broad for any authenticated worker. Ministry writes require
-- ministries:manage. Department has no app write path (seed-only).
-- WorkloadCategory writes require ministry:manage (distinct module from
-- "ministries").

alter table public."Ministry" enable row level security;
alter table public."Department" enable row level security;
alter table public."WorkloadCategory" enable row level security;

-- Ministry
create policy "ministry_select_authenticated" on public."Ministry"
  for select to authenticated using (true);

create policy "ministry_insert_ministries_manage" on public."Ministry"
  for insert to authenticated with check (public.has_permission('ministries','manage'));

create policy "ministry_update_ministries_manage" on public."Ministry"
  for update to authenticated using (public.has_permission('ministries','manage')) with check (public.has_permission('ministries','manage'));

create policy "ministry_delete_ministries_manage" on public."Ministry"
  for delete to authenticated using (public.has_permission('ministries','manage'));

-- Department (read-only via PostgREST, no app write path)
create policy "department_select_authenticated" on public."Department"
  for select to authenticated using (true);

-- WorkloadCategory
create policy "workloadcategory_select_authenticated" on public."WorkloadCategory"
  for select to authenticated using (true);

create policy "workloadcategory_insert_ministry_manage" on public."WorkloadCategory"
  for insert to authenticated with check (public.has_permission('ministry','manage'));

create policy "workloadcategory_update_ministry_manage" on public."WorkloadCategory"
  for update to authenticated using (public.has_permission('ministry','manage')) with check (public.has_permission('ministry','manage'));

create policy "workloadcategory_delete_ministry_manage" on public."WorkloadCategory"
  for delete to authenticated using (public.has_permission('ministry','manage'));
