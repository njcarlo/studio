-- Hardening for the RLS helper functions added in 20260612010000_rls_helpers.sql:
--
-- 1. current_worker_email() had no search_path set (linter: function_search_path_mutable).
--    It only calls schema-qualified auth.jwt(), so search_path = '' is safe.
--
-- 2. All 5 helpers were granted EXECUTE to `anon`, which makes them callable as public
--    RPC endpoints (linter: anon_security_definer_function_executable). Every RLS policy
--    in this project is `TO authenticated`, so `anon` never needs to evaluate these —
--    revoking removes the unnecessary public surface without affecting RLS.

alter function public.current_worker_email() set search_path = '';

revoke execute on function public.current_worker_email() from anon;
revoke execute on function public.current_worker_id() from anon;
revoke execute on function public.is_super_admin() from anon;
revoke execute on function public.has_permission(text, text) from anon;
revoke execute on function public.can_manage_ministry_assistance(text) from anon;
