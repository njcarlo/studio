-- RLS for facilities tables: Branch, Area, Room, VenueElement.
-- SELECT is broad for any authenticated worker; all writes require
-- facilities:manage.

alter table public."Branch" enable row level security;
alter table public."Area" enable row level security;
alter table public."Room" enable row level security;
alter table public."VenueElement" enable row level security;

-- Branch
create policy "branch_select_authenticated" on public."Branch"
  for select to authenticated using (true);

create policy "branch_insert_facilities_manage" on public."Branch"
  for insert to authenticated with check (public.has_permission('facilities','manage'));

create policy "branch_update_facilities_manage" on public."Branch"
  for update to authenticated using (public.has_permission('facilities','manage')) with check (public.has_permission('facilities','manage'));

create policy "branch_delete_facilities_manage" on public."Branch"
  for delete to authenticated using (public.has_permission('facilities','manage'));

-- Area
create policy "area_select_authenticated" on public."Area"
  for select to authenticated using (true);

create policy "area_insert_facilities_manage" on public."Area"
  for insert to authenticated with check (public.has_permission('facilities','manage'));

create policy "area_update_facilities_manage" on public."Area"
  for update to authenticated using (public.has_permission('facilities','manage')) with check (public.has_permission('facilities','manage'));

create policy "area_delete_facilities_manage" on public."Area"
  for delete to authenticated using (public.has_permission('facilities','manage'));

-- Room
create policy "room_select_authenticated" on public."Room"
  for select to authenticated using (true);

create policy "room_insert_facilities_manage" on public."Room"
  for insert to authenticated with check (public.has_permission('facilities','manage'));

create policy "room_update_facilities_manage" on public."Room"
  for update to authenticated using (public.has_permission('facilities','manage')) with check (public.has_permission('facilities','manage'));

create policy "room_delete_facilities_manage" on public."Room"
  for delete to authenticated using (public.has_permission('facilities','manage'));

-- VenueElement
create policy "venueelement_select_authenticated" on public."VenueElement"
  for select to authenticated using (true);

create policy "venueelement_insert_facilities_manage" on public."VenueElement"
  for insert to authenticated with check (public.has_permission('facilities','manage'));

create policy "venueelement_update_facilities_manage" on public."VenueElement"
  for update to authenticated using (public.has_permission('facilities','manage')) with check (public.has_permission('facilities','manage'));

create policy "venueelement_delete_facilities_manage" on public."VenueElement"
  for delete to authenticated using (public.has_permission('facilities','manage'));
