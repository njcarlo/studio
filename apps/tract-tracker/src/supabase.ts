import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing Supabase environment variables. Check your .env file.');
}

// Public client — respects RLS. Privileged operations (auth, admin, post
// writes) go through edge functions (auth-api, users-api, posts-api), which
// hold the service-role key server-side and are never exposed to the client.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { storageKey: 'supabase-anon' },
});

export function callApi<T = any>(fn: 'auth-api' | 'users-api' | 'posts-api' | 'drive-sync', body: Record<string, unknown>): Promise<{ data: T | null; error: { message: string } | null }> {
    return supabase.functions.invoke(fn, { body }).then(({ data, error }) => {
        if (error) return { data: null, error: { message: error.message } };
        if (data?.error) return { data: null, error: { message: data.error } };
        return { data: data as T, error: null };
    });
}
