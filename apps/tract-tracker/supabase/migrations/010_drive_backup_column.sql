-- Tracks whether a correspondent_posts row has a confirmed Google Drive
-- backup. FIFO storage cleanup (posts-api) only deletes posts that have
-- one, so the "permanent archive" guarantee actually holds.
ALTER TABLE public.correspondent_posts
    ADD COLUMN IF NOT EXISTS drive_file_id text;
