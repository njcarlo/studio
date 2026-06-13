-- Layer 1 (RBAC restructure): Custom Access Token Hook
--
-- Adds Worker's role/flags/ministry scoping to the session JWT as custom
-- claims, so client-side permission checks (useUserRole / Zustand store) and
-- RLS policies can read them directly from the token (O(1)) instead of a
-- join on every request. RLS has_permission()/is_super_admin() remain the
-- server-side backstop and are unaffected by this hook.
--
-- Claim names are prefixed `app_` to avoid colliding with GoTrue/PostgREST's
-- own `role` claim (which controls the Postgres role used for RLS — must
-- stay `authenticated`/`anon`/`service_role`).
--
-- IMPORTANT — manual step required (cannot be done via migration):
-- In the Supabase Dashboard, go to Authentication > Hooks > "Customize
-- Access Token (JWT) Claims hook" and select
-- `public.custom_access_token_hook`. Until that is enabled, this function
-- exists but is not invoked, and clients keep using the default claims.

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  claims jsonb;
  worker record;
begin
  claims := event->'claims';

  select
    coalesce(r.name, '')           as role_name,
    coalesce(r."isSuperAdmin", false) as is_super_admin,
    coalesce(w.flags, '{}')        as flags,
    w."majorMinistryId"            as major_ministry_id,
    w."minorMinistryId"            as minor_ministry_id,
    w."subMinistryId"              as sub_ministry_id
  into worker
  from public."Worker" w
  left join public."Role" r on r.id = w."roleId"
  where lower(w.email) = lower(coalesce(claims->>'email', ''))
  limit 1;

  if worker is null then
    return event;
  end if;

  claims := jsonb_set(claims, '{app_role}', to_jsonb(worker.role_name));
  claims := jsonb_set(claims, '{app_is_super_admin}', to_jsonb(worker.is_super_admin));
  claims := jsonb_set(claims, '{app_flags}', to_jsonb(worker.flags));
  claims := jsonb_set(claims, '{app_major_ministry_id}', to_jsonb(worker.major_ministry_id));
  claims := jsonb_set(claims, '{app_minor_ministry_id}', to_jsonb(worker.minor_ministry_id));
  claims := jsonb_set(claims, '{app_sub_ministry_id}', to_jsonb(worker.sub_ministry_id));

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

-- Auth hooks are invoked by the `supabase_auth_admin` role only.
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

-- The function reads "Worker" and "Role" with security definer — grant
-- read access to supabase_auth_admin on just those tables/columns it needs.
grant usage on schema public to supabase_auth_admin;
grant select on public."Worker" to supabase_auth_admin;
grant select on public."Role" to supabase_auth_admin;
