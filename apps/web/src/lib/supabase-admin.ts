import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Admin client — server-side only.
 * Uses the service role key which bypasses RLS.
 * Never expose this to the client.
 */
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);
