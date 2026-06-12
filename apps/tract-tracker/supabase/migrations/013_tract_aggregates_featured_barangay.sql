-- Adds a barangay breakdown scoped to the COG Dasmarinas region, so
-- LedWallBarangay's leaderboard isn't the nationwide barangay totals.
-- Return type (OUT params) changed again, so drop before recreate.
DROP FUNCTION IF EXISTS public.get_tract_aggregates();

CREATE OR REPLACE FUNCTION public.get_tract_aggregates()
RETURNS TABLE (
    grand_total bigint,
    total_participants bigint,
    by_region json,
    by_region_participants json,
    by_barangay json,
    by_barangay_featured json
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
           ) b) AS by_barangay,
        (SELECT COALESCE(json_object_agg(barangay, total), '{}'::json)
           FROM (
               SELECT barangay, SUM(tracts_given) AS total
               FROM tract_users
               WHERE barangay IS NOT NULL AND barangay <> ''
                 AND region = 'COG Dasmarinas'
               GROUP BY barangay
           ) bf) AS by_barangay_featured
    FROM tract_users;
$$;

GRANT EXECUTE ON FUNCTION public.get_tract_aggregates() TO anon, authenticated;
