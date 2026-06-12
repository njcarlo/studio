-- users-api, posts-api, and AuthContext.tsx all reference tract_users.is_admin,
-- but the column was never created. PostgREST errors on selects that name a
-- non-existent column, so requireAdmin()/isPrivileged() always received
-- data: null and returned false — causing adminList to 403 and post deletes
-- to 404 with "Requester not found" for everyone, including admins.
ALTER TABLE public.tract_users
ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

UPDATE public.tract_users
SET is_admin = true
WHERE lower(email) IN ('njcarlo@gmail.com', 'cogtv@gmail.com');
