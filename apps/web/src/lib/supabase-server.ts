import { cache } from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Server-side Supabase client bound to the request's cookies — lets Server
 * Actions and Server Components resolve "who is calling" without any token
 * passed explicitly from the client.
 *
 * Only valid in the standalone (web) build: static export (`BUILD_MOBILE`)
 * has no server runtime, so `cookies()`/middleware never run there.
 */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component — middleware refreshes the
          // session instead, so writes here can be safely ignored.
        }
      },
    },
  });
}

/**
 * Resolves the current authenticated user once per request. Wrapped in
 * React's `cache()` so every `requirePermission`/action call in a request
 * chain reuses the same Supabase Auth round-trip instead of repeating it.
 */
export const getServerUser = cache(async () => {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return null;
  }
  return data.user;
});
