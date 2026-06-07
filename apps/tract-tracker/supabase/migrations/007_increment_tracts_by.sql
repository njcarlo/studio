-- Atomic batch increment (handles offline-queued taps synced in one call).
-- SECURITY DEFINER + only callable from edge functions via the service-role
-- client, so it isn't exposed to anon/authenticated directly.
CREATE OR REPLACE FUNCTION public.increment_tracts_by(uid uuid, amount int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_count int;
BEGIN
    UPDATE public.tract_users
    SET tracts_given = tracts_given + amount
    WHERE id = uid
    RETURNING tracts_given INTO new_count;
    RETURN new_count;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_tracts_by(uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_tracts_by(uuid, int) TO service_role;
