-- RLS for the RBAC identity tables: Role, Permission, RolePermission,
-- WorkerRole, Worker. SELECT is broad for any authenticated worker; writes
-- are gated by the roles:* permission family (see registry.ts).

alter table public."Role" enable row level security;
alter table public."Permission" enable row level security;
alter table public."RolePermission" enable row level security;
alter table public."WorkerRole" enable row level security;
alter table public."Worker" enable row level security;

-- Role
create policy "role_select_authenticated" on public."Role"
  for select to authenticated using (true);

create policy "role_insert_roles_create" on public."Role"
  for insert to authenticated with check (public.has_permission('roles','create'));

create policy "role_update_roles_update" on public."Role"
  for update to authenticated using (public.has_permission('roles','update')) with check (public.has_permission('roles','update'));

create policy "role_delete_roles_delete" on public."Role"
  for delete to authenticated using (public.has_permission('roles','delete'));

-- Permission
create policy "permission_select_authenticated" on public."Permission"
  for select to authenticated using (true);

create policy "permission_insert_roles_update" on public."Permission"
  for insert to authenticated with check (public.has_permission('roles','update'));

create policy "permission_update_roles_update" on public."Permission"
  for update to authenticated using (public.has_permission('roles','update')) with check (public.has_permission('roles','update'));

-- RolePermission
create policy "rolepermission_select_authenticated" on public."RolePermission"
  for select to authenticated using (true);

create policy "rolepermission_insert_roles_update" on public."RolePermission"
  for insert to authenticated with check (public.has_permission('roles','update'));

create policy "rolepermission_update_roles_update" on public."RolePermission"
  for update to authenticated using (public.has_permission('roles','update')) with check (public.has_permission('roles','update'));

create policy "rolepermission_delete_roles_update" on public."RolePermission"
  for delete to authenticated using (public.has_permission('roles','update'));

-- WorkerRole
create policy "workerrole_select_authenticated" on public."WorkerRole"
  for select to authenticated using (true);

create policy "workerrole_insert_roles_assign" on public."WorkerRole"
  for insert to authenticated with check (public.has_permission('roles','assign'));

create policy "workerrole_update_roles_assign" on public."WorkerRole"
  for update to authenticated using (public.has_permission('roles','assign')) with check (public.has_permission('roles','assign'));

create policy "workerrole_delete_roles_assign" on public."WorkerRole"
  for delete to authenticated using (public.has_permission('roles','assign'));

-- Worker
-- NOTE: no "edit my own profile" UPDATE carve-out — Worker has privilege
-- columns (roleId, capabilities, status, isSeniorPastor) that a self-row
-- policy would let a worker mutate via PostgREST. Follow-up: a
-- SECURITY DEFINER RPC with a column whitelist, or column-level GRANT/REVOKE
-- (see apps/tract-tracker/supabase/migrations/006_lock_down_tract_users.sql).
create policy "worker_select_authenticated" on public."Worker"
  for select to authenticated using (true);

create policy "worker_insert_self_or_workers_create" on public."Worker"
  for insert to authenticated with check (
    lower("email") = public.current_worker_email() or public.has_permission('workers','create')
  );

create policy "worker_update_workers_or_approvals" on public."Worker"
  for update to authenticated using (
    public.has_permission('workers','update')
    or public.has_permission('approvals','manage')
    or public.has_permission('approvals','approve_all')
  ) with check (
    public.has_permission('workers','update')
    or public.has_permission('approvals','manage')
    or public.has_permission('approvals','approve_all')
  );
