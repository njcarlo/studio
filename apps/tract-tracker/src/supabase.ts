import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase environment variables. Check your .env file.');
}

// Standard client — respects RLS
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { storageKey: 'supabase-anon' },
});

// Admin client — bypasses RLS (use only for admin operations)
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { storageKey: 'supabase-admin' },
});
