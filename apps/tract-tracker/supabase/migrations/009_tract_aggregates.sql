-- Single-query aggregates for live dashboards (LiveBoard, LedWall, LedWallBarangay,
-- DashboardScreen, ActionScreen). Replaces the per-screen pattern of paging through
-- the entire tract_users table (1000 rows/page) every 30s, which was exhausting the
-- nano instance's connection pool during the live event.
CREATE OR REPLACE FUNCTION public.get_tract_aggregates()
RETURNS TABLE (
    grand_total bigint,
    total_participants bigint,
    by_region json,
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
