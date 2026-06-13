-- RLS for AssistanceRequest. SELECT is broad for any authenticated worker.
-- INSERT is open (created as a side-effect of any worker's own booking).
-- UPDATE requires can_manage_ministry_assistance() for the request's
-- ministry (full venue_assistance:manage, or own-ministry leadership with
-- venue_assistance:manage_own_ministry). No DELETE policy.

alter table public."AssistanceRequest" enable row level security;

create policy "assistancerequest_select_authenticated" on public."AssistanceRequest"
  for select to authenticated using (true);

create policy "assistancerequest_insert_any" on public."AssistanceRequest"
  for insert to authenticated with check (true);

create policy "assistancerequest_update_manage_ministry" on public."AssistanceRequest"
  for update to authenticated using (
    public.can_manage_ministry_assistance("ministryId")
  ) with check (
    public.can_manage_ministry_assistance("ministryId")
  );
