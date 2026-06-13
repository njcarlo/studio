-- Helper functions for RLS policies, mirroring the apps/web permission registry
-- (apps/web/src/lib/permissions/registry.ts) and requirePermission() logic
-- (apps/web/src/lib/auth/require-permission.ts), which maps the authenticated
-- Supabase user to a Worker row by email (Worker.id != auth.users.id).

create or replace function public.current_worker_email() returns text
language sql stable as $$
  select lower(coalesce(auth.jwt()->>'email', ''))
$$;

create or replace function public.current_worker_id() returns text
language sql stable security definer set search_path = public as $$
  select id from "Worker" where lower(email) = public.current_worker_email() limit 1
$$;

create or replace function public.is_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from "WorkerRole" wr
    join "Role" r on r.id = wr."roleId"
    join "Worker" w on w.id = wr."workerId"
    where lower(w.email) = public.current_worker_email() and r."isSuperAdmin"
  )
$$;

create or replace function public.has_permission(p_module text, p_action text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_super_admin() or exists (
    select 1
    from "WorkerRole" wr
    join "Worker" w on w.id = wr."workerId"
    join "RolePermission" rp on rp."roleId" = wr."roleId"
    join "Permission" p on p.id = rp."permissionId"
    where lower(w.email) = public.current_worker_email()
      and p.module = p_module and p.action = p_action
  )
$$;

-- "Can this worker manage assistance for this ministry?" — used by venue_assistance tables
create or replace function public.can_manage_ministry_assistance(p_ministry_id text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_permission('venue_assistance','manage')
    or (
      public.has_permission('venue_assistance','manage_own_ministry')
      and exists (
        select 1 from "Ministry" m
        where m.id = p_ministry_id
          and public.current_worker_id() in (m."headId", m."managerId", m."schedulerId", m."approverId")
      )
    )
$$;

grant execute on function public.current_worker_email() to authenticated, anon;
grant execute on function public.current_worker_id() to authenticated, anon;
grant execute on function public.is_super_admin() to authenticated, anon;
grant execute on function public.has_permission(text, text) to authenticated, anon;
grant execute on function public.can_manage_ministry_assistance(text) to authenticated, anon;
