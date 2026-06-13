-- Follow-up for two items from the security advisor:
--
-- 1. 20260613000000_rls_ministry_scheduler_ids_array.sql re-created
--    can_manage_ministry_assistance() and re-granted EXECUTE to `anon`,
--    undoing 20260612170921_rls_helpers_hardening.sql /
--    20260612170952_rls_helpers_revoke_public_execute.sql. Re-revoke —
--    every policy using this helper is `TO authenticated`.
--
-- 2. adjust_item_stock() (20260531000000_atomic_stock_adjustment.sql) has
--    no search_path set (linter: function_search_path_mutable). It only
--    references unqualified tables in `public`, so pin search_path there.

revoke execute on function public.can_manage_ministry_assistance(text) from anon;
revoke execute on function public.can_manage_ministry_assistance(text) from public;

alter function public.adjust_item_stock(uuid, integer, text, text, text) set search_path = public;
