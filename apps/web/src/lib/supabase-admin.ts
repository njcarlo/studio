import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Admin client — server-side only.
 * Uses the service role key which bypasses RLS.
 * Never expose this to the client.
 */
let supabaseAdminClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdminClient() {
    if (supabaseAdminClient) return supabaseAdminClient;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const missingVars: string[] = [];
    if (!url) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!serviceRoleKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');

    if (missingVars.length > 0) {
        throw new Error(
            `Missing Supabase admin environment variables: ${missingVars.join(', ')}`
        );
    }

    supabaseAdminClient = createClient(url!, serviceRoleKey!, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    return supabaseAdminClient;
}
