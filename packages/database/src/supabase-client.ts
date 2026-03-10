import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === 'production') {
        console.warn('Supabase URL or Anon Key is missing. Database features may not work.');
    }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper to get a typed Supabase client if needed.
 * But we'll mostly use Prisma for server-side and Supabase for client-side Auth/Realtime.
 */
export const getSupabase = () => supabase;
