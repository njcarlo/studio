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

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects'
        AND policyname = 'Public read correspondent photos'
    ) THEN
        CREATE POLICY "Public read correspondent photos"
            ON storage.objects FOR SELECT
            USING (bucket_id = 'correspondent-photos');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects'
        AND policyname = 'Service role insert correspondent photos'
    ) THEN
        CREATE POLICY "Service role insert correspondent photos"
            ON storage.objects FOR INSERT
            WITH CHECK (bucket_id = 'correspondent-photos');
    END IF;
END $$;
