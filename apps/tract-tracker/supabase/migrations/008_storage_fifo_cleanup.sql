-- storage.objects isn't exposed through PostgREST, so this SECURITY DEFINER
-- function lets posts-api (service role) read total bucket usage for FIFO cleanup.
CREATE OR REPLACE FUNCTION public.correspondent_storage_bytes()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = storage, public
AS $$
    SELECT COALESCE(SUM((metadata->>'size')::bigint), 0)::bigint
    FROM storage.objects
    WHERE bucket_id = 'correspondent-photos';
$$;

GRANT EXECUTE ON FUNCTION public.correspondent_storage_bytes() TO service_role;
