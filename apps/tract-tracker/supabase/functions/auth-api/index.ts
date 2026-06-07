/**
 * Supabase Edge Function: auth-api
 *
 * Handles all custom-auth operations server-side, using the service-role key
 * (available automatically as SUPABASE_SERVICE_ROLE_KEY in every edge function's
 * environment — never exposed to the client). The client only ever holds the
 * public anon key.
 *
 * Actions (POST body: { action, ...params }):
 *   signin         { email, password }                          -> { user }
 *   signup         { email, password, name, region,
 *                    subRegion, barangay }                      -> { user }
 *   session        { userId }                                   -> { user }
 *   forgotPassword { email }                                    -> { tempPassword }
 *
 * The returned `user` object never includes the `password` column.
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

function sanitize(user: Record<string, unknown> | null) {
    if (!user) return null;
    const { password: _password, ...rest } = user;
    return rest;
}

const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const body = await req.json();
        const { action } = body ?? {};

        switch (action) {
            case 'signin': {
                const { email, password } = body;
                if (!email || !password) return json({ error: 'Please enter your email and password.' }, 400);

                const { data, error } = await admin
                    .from('tract_users')
                    .select('*')
                    .eq('email', String(email).trim().toLowerCase())
                    .eq('password', password)
                    .maybeSingle();
                if (error || !data) return json({ error: 'Invalid email or password.' }, 401);
                return json({ user: sanitize(data) });
            }

            case 'signup': {
                const { email, password, name, region, subRegion, barangay } = body;
                if (!email || !password) return json({ error: 'Please enter your email and password.' }, 400);
                const cleanEmail = String(email).trim().toLowerCase();

                const { data: existing } = await admin
                    .from('tract_users')
                    .select('id')
                    .eq('email', cleanEmail)
                    .maybeSingle();
                if (existing) return json({ error: 'Email already registered.' }, 409);

                const { data, error } = await admin.from('tract_users').insert({
                    email: cleanEmail,
                    password,
                    name: name || cleanEmail.split('@')[0],
                    region: region || '',
                    sub_region: subRegion || '',
                    barangay: barangay || null,
                    tracts_given: 0,
                }).select().single();

                if (error || !data) return json({ error: error?.message || 'Failed to create account.' }, 400);
                return json({ user: sanitize(data) });
            }

            case 'session': {
                const { userId } = body;
                if (!userId) return json({ error: 'userId is required.' }, 400);

                const { data, error } = await admin
                    .from('tract_users')
                    .select('*')
                    .eq('id', userId)
                    .single();
                if (error || !data) return json({ error: 'Session not found.' }, 404);
                return json({ user: sanitize(data) });
            }

            case 'forgotPassword': {
                const { email } = body;
                if (!email) return json({ error: 'Please enter your email address.' }, 400);
                const cleanEmail = String(email).trim().toLowerCase();

                const { data: existing } = await admin
                    .from('tract_users')
                    .select('id')
                    .eq('email', cleanEmail)
                    .maybeSingle();
                if (!existing) return json({ error: 'No account found with that email address.' }, 404);

                const tempPassword = Math.random().toString(36).slice(-8);
                const { error } = await admin
                    .from('tract_users')
                    .update({ password: tempPassword })
                    .eq('email', cleanEmail);
                if (error) return json({ error: error.message }, 400);
                return json({ tempPassword });
            }

            default:
                return json({ error: `Unknown action: ${action}` }, 400);
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('auth-api error:', message);
        return json({ error: message }, 500);
    }
});
