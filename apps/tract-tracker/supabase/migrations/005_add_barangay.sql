-- Store the poster's barangay alongside region for finer-grained location display.
ALTER TABLE public.correspondent_posts
ADD COLUMN IF NOT EXISTS barangay text NOT NULL DEFAULT '';
