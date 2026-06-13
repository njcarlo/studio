-- RLS for venue booking tables: Booking (legacy), VenueBooking,
-- RecurringBooking. SELECT is broad for any authenticated worker.
-- VenueBooking/RecurringBooking allow a worker to manage their own
-- bookings (workerProfileId = current_worker_id()) in addition to the
-- venues:* permission family. No DELETE policies — app cancels via UPDATE.

alter table public."Booking" enable row level security;
alter table public."VenueBooking" enable row level security;
alter table public."RecurringBooking" enable row level security;

-- Booking (legacy)
create policy "booking_select_authenticated" on public."Booking"
  for select to authenticated using (true);

create policy "booking_insert_venues_create" on public."Booking"
  for insert to authenticated with check (public.has_permission('venues','create'));

create policy "booking_update_venues_update" on public."Booking"
  for update to authenticated using (public.has_permission('venues','update')) with check (public.has_permission('venues','update'));

create policy "booking_delete_venues_delete" on public."Booking"
  for delete to authenticated using (public.has_permission('venues','delete'));

-- VenueBooking
create policy "venuebooking_select_authenticated" on public."VenueBooking"
  for select to authenticated using (true);

create policy "venuebooking_insert_own_or_venues_create" on public."VenueBooking"
  for insert to authenticated with check (
    "workerProfileId" = public.current_worker_id() or public.has_permission('venues','create')
  );

create policy "venuebooking_update_own_or_venues_manage" on public."VenueBooking"
  for update to authenticated using (
    "workerProfileId" = public.current_worker_id()
    or public.has_permission('venues','update')
    or public.has_permission('venues','approve')
  ) with check (
    "workerProfileId" = public.current_worker_id()
    or public.has_permission('venues','update')
    or public.has_permission('venues','approve')
  );

-- RecurringBooking
create policy "recurringbooking_select_authenticated" on public."RecurringBooking"
  for select to authenticated using (true);

create policy "recurringbooking_insert_own_or_venues_create" on public."RecurringBooking"
  for insert to authenticated with check (
    "workerProfileId" = public.current_worker_id() or public.has_permission('venues','create')
  );

create policy "recurringbooking_update_own_or_venues_manage" on public."RecurringBooking"
  for update to authenticated using (
    "workerProfileId" = public.current_worker_id()
    or public.has_permission('venues','update')
    or public.has_permission('venues','approve')
  ) with check (
    "workerProfileId" = public.current_worker_id()
    or public.has_permission('venues','update')
    or public.has_permission('venues','approve')
  );
