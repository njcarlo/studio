-- RLS for MealStub. SELECT is broad for any authenticated worker.
-- INSERT/DELETE require meals:manage. UPDATE also allows attendance:scan
-- (covers claimMealStub in supabase/functions/meals/index.ts, which marks a
-- stub as 'Used' at the scan point).

alter table public."MealStub" enable row level security;

create policy "mealstub_select_authenticated" on public."MealStub"
  for select to authenticated using (true);

create policy "mealstub_insert_meals_manage" on public."MealStub"
  for insert to authenticated with check (public.has_permission('meals','manage'));

create policy "mealstub_update_meals_manage_or_scan" on public."MealStub"
  for update to authenticated using (
    public.has_permission('meals','manage') or public.has_permission('attendance','scan')
  ) with check (
    public.has_permission('meals','manage') or public.has_permission('attendance','scan')
  );

create policy "mealstub_delete_meals_manage" on public."MealStub"
  for delete to authenticated using (public.has_permission('meals','manage'));
