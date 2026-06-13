-- Functions get an implicit `EXECUTE ... TO PUBLIC` grant on creation in Postgres.
-- The previous migration revoked EXECUTE from `anon` directly, but `anon` still
-- inherited EXECUTE via the PUBLIC grant. Revoke from PUBLIC as well — `authenticated`
-- keeps its explicit grant from 20260612010000_rls_helpers.sql, which RLS policies need.

revoke execute on function public.current_worker_email() from public;
revoke execute on function public.current_worker_id() from public;
revoke execute on function public.is_super_admin() from public;
revoke execute on function public.has_permission(text, text) from public;
revoke execute on function public.can_manage_ministry_assistance(text) from public;
