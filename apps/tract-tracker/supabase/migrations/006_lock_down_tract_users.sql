-- The existing "Anyone can read tract_users" policy controls row visibility only —
-- it does NOT stop anon/authenticated clients from selecting the plaintext
-- `password` and `email` columns directly via the REST API (e.g. ?select=*).
-- Restrict column-level access so only non-sensitive fields are readable by
-- the public roles. Leaderboard/map/liveboard features only ever need these.
-- service_role (used exclusively by edge functions from now on) bypasses both
-- RLS and column grants, so admin/auth flows are unaffected.

REVOKE SELECT ON public.tract_users FROM anon, authenticated;

GRANT SELECT (id, name, region, sub_region, barangay, tracts_given, is_correspondent, created_at)
    ON public.tract_users TO anon, authenticated;
