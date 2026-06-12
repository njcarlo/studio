-- Publicly-viewable Drive link for a post's confirmed backup
-- (https://lh3.googleusercontent.com/d/{drive_file_id}). FIFO archiving
-- repoints correspondent_posts.image_url here once the Storage object
-- is removed.
ALTER TABLE public.correspondent_posts
    ADD COLUMN IF NOT EXISTS drive_view_url text;
