-- Convert Ministry.schedulerId (single) to schedulerIds (array) to support multiple ministry schedulers
alter table "Ministry" add column "schedulerIds" text[] not null default '{}';

update "Ministry"
set "schedulerIds" = array_remove(array["schedulerId"], null)
where "schedulerId" is not null;

alter table "Ministry" drop column "schedulerId";

-- Update RLS helper to check membership in schedulerIds array instead of single schedulerId column
create or replace function public.can_manage_ministry_assistance(p_ministry_id text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_permission('venue_assistance','manage')
    or (
      public.has_permission('venue_assistance','manage_own_ministry')
      and exists (
        select 1 from "Ministry" m
        where m.id = p_ministry_id
          and (
            public.current_worker_id() in (m."headId", m."managerId", m."approverId")
            or public.current_worker_id() = any(m."schedulerIds")
          )
      )
    )
$$;

-- Note: do not grant to `anon` — the hardening migrations revoke `anon`/`PUBLIC`
-- execute on all RLS helper functions (every policy here is `TO authenticated`).
grant execute on function public.can_manage_ministry_assistance(text) to authenticated;
