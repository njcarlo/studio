import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

const missingSupabaseConfigError =
    'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.';

function createMissingSupabaseClient(): SupabaseClient {
    return new Proxy(
        {},
        {
            get() {
                throw new Error(missingSupabaseConfigError);
            },
        }
    ) as SupabaseClient;
}

if (!hasSupabaseConfig) {
    console.warn('Supabase URL or Anon Key is missing. Database features may not work.');
}

const isServer = typeof window === 'undefined';

export const supabase: SupabaseClient = hasSupabaseConfig
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: !isServer,
            autoRefreshToken: !isServer,
            detectSessionInUrl: !isServer,
        }
    })
    : createMissingSupabaseClient();

export const isSupabaseConfigured = hasSupabaseConfig;

/**
 * Helper to get a typed Supabase client if needed.
 * But we'll mostly use Prisma for server-side and Supabase for client-side Auth/Realtime.
 */
export const getSupabase = () => supabase;
