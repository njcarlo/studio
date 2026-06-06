-- Add correspondent role flag to tract_users
ALTER TABLE public.tract_users
ADD COLUMN IF NOT EXISTS is_correspondent boolean NOT NULL DEFAULT false;

-- Table for photo posts by correspondents
CREATE TABLE IF NOT EXISTS public.correspondent_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.tract_users(id) ON DELETE CASCADE,
    user_name text NOT NULL,
    region text NOT NULL DEFAULT '',
    image_url text NOT NULL,
    caption text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.correspondent_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read correspondent posts"
    ON public.correspondent_posts
    FOR SELECT
    USING (true);

-- Storage bucket for correspondent photos (run in Supabase dashboard if SQL fails)
INSERT INTO storage.buckets (id, name, public)
VALUES ('correspondent-photos', 'correspondent-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY IF NOT EXISTS "Public read correspondent photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'correspondent-photos');

CREATE POLICY IF NOT EXISTS "Service role insert correspondent photos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'correspondent-photos');
