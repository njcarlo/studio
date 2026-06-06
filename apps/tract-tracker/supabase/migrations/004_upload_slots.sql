-- Track whether each post came from a designated correspondent or a regular user.
-- This allows fast counting for the first-come-first-serve slot pool.
ALTER TABLE public.correspondent_posts
ADD COLUMN IF NOT EXISTS from_correspondent boolean NOT NULL DEFAULT false;

-- Index so the slot-pool count query is fast even with 30k rows.
CREATE INDEX IF NOT EXISTS idx_posts_from_correspondent
    ON public.correspondent_posts (from_correspondent);

-- Optional: store the Google Drive file ID once the edge function runs.
ALTER TABLE public.correspondent_posts
ADD COLUMN IF NOT EXISTS gdrive_file_id text;
