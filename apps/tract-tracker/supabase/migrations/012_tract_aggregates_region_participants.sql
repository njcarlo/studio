-- Adds per-region participant counts so screens (e.g. LedWallBarangay) can show
-- "COG Dasmarinas" totals/participants without a separate query.
-- Return type (OUT params) changed from migration 009, so the old function
-- must be dropped before it can be recreated.
DROP FUNCTION IF EXISTS public.get_tract_aggregates();

CREATE OR REPLACE FUNCTION public.get_tract_aggregates()
RETURNS TABLE (
    grand_total bigint,
    total_participants bigint,
    by_region json,
    by_region_participants json,
    by_barangay json
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        COALESCE(SUM(tracts_given), 0)::bigint AS grand_total,
        COUNT(*)::bigint AS total_participants,
        (SELECT COALESCE(json_object_agg(region, total), '{}'::json)
           FROM (
               SELECT region, SUM(tracts_given) AS total
               FROM tract_users
               WHERE region IS NOT NULL AND region <> ''
               GROUP BY region
           ) r) AS by_region,
        (SELECT COALESCE(json_object_agg(region, total), '{}'::json)
           FROM (
               SELECT region, COUNT(*) AS total
               FROM tract_users
               WHERE region IS NOT NULL AND region <> ''
               GROUP BY region
           ) rp) AS by_region_participants,
        (SELECT COALESCE(json_object_agg(barangay, total), '{}'::json)
           FROM (
               SELECT barangay, SUM(tracts_given) AS total
               FROM tract_users
               WHERE barangay IS NOT NULL AND barangay <> ''
               GROUP BY barangay
           ) b) AS by_barangay
    FROM tract_users;
$$;

GRANT EXECUTE ON FUNCTION public.get_tract_aggregates() TO anon, authenticated;
