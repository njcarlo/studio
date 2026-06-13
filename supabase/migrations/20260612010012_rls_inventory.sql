-- RLS for inventory tables: InventoryCategory, InventoryItem, InventoryLog,
-- InventoryBorrowing. SELECT is broad for any authenticated worker.
-- Category/Item writes require inventory:manage. InventoryLog is
-- append-only via inventory:manage. InventoryBorrowing requires
-- inventory:access, scoped to the worker's own borrowings unless they also
-- have inventory:manage. No DELETE policies for log/borrowing.

alter table public."InventoryCategory" enable row level security;
alter table public."InventoryItem" enable row level security;
alter table public."InventoryLog" enable row level security;
alter table public."InventoryBorrowing" enable row level security;

-- InventoryCategory
create policy "inventorycategory_select_authenticated" on public."InventoryCategory"
  for select to authenticated using (true);

create policy "inventorycategory_insert_inventory_manage" on public."InventoryCategory"
  for insert to authenticated with check (public.has_permission('inventory','manage'));

create policy "inventorycategory_update_inventory_manage" on public."InventoryCategory"
  for update to authenticated using (public.has_permission('inventory','manage')) with check (public.has_permission('inventory','manage'));

create policy "inventorycategory_delete_inventory_manage" on public."InventoryCategory"
  for delete to authenticated using (public.has_permission('inventory','manage'));

-- InventoryItem
create policy "inventoryitem_select_authenticated" on public."InventoryItem"
  for select to authenticated using (true);

create policy "inventoryitem_insert_inventory_manage" on public."InventoryItem"
  for insert to authenticated with check (public.has_permission('inventory','manage'));

create policy "inventoryitem_update_inventory_manage" on public."InventoryItem"
  for update to authenticated using (public.has_permission('inventory','manage')) with check (public.has_permission('inventory','manage'));

create policy "inventoryitem_delete_inventory_manage" on public."InventoryItem"
  for delete to authenticated using (public.has_permission('inventory','manage'));

-- InventoryLog
create policy "inventorylog_select_authenticated" on public."InventoryLog"
  for select to authenticated using (true);

create policy "inventorylog_insert_inventory_manage" on public."InventoryLog"
  for insert to authenticated with check (public.has_permission('inventory','manage'));

-- InventoryBorrowing
create policy "inventoryborrowing_select_authenticated" on public."InventoryBorrowing"
  for select to authenticated using (true);

create policy "inventoryborrowing_insert_access" on public."InventoryBorrowing"
  for insert to authenticated with check (
    public.has_permission('inventory','access')
    and ("borrowerId" = public.current_worker_id() or public.has_permission('inventory','manage'))
  );

create policy "inventoryborrowing_update_access" on public."InventoryBorrowing"
  for update to authenticated using (
    public.has_permission('inventory','access')
    and ("borrowerId" = public.current_worker_id() or public.has_permission('inventory','manage'))
  ) with check (
    public.has_permission('inventory','access')
    and ("borrowerId" = public.current_worker_id() or public.has_permission('inventory','manage'))
  );
