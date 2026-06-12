/**
 * Supabase Edge Function: users-api
 *
 * Server-side operations on tract_users that need elevated privileges
 * (writes, cross-user aggregate reads, admin actions). Uses the service-role
 * key from the function's own environment — never sent to the client.
 *
 * Actions (POST body: { action, ...params }):
 *   updateProfile             { userId, region, subRegion, barangay }   -> { ok }
 *   increment                 { userId, amount }                        -> { tractsGiven }
 *   adminList                 { requesterId }                           -> { users }
 *   adminToggleCorrespondent  { requesterId, userId, value }            -> { ok }
 *   adminResetCounts          { requesterId }                           -> { ok }
 *
 * Admin actions verify the requester server-side (is_admin flag OR a
 * hardcoded admin email) — mirrors AuthContext.tsx ADMIN_EMAILS.
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

const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Mirrors AuthContext.tsx ADMIN_EMAILS — emails treated as admin without a DB flag.
const ADMIN_EMAILS = new Set(['njcarlo@gmail.com', 'cogtv@gmail.com']);

async function requireAdmin(requesterId: string): Promise<boolean> {
    if (!requesterId) return false;
    const { data } = await admin
        .from('tract_users')
        .select('is_admin, email')
        .eq('id', requesterId)
        .maybeSingle();
    if (!data) return false;
    return data.is_admin === true || ADMIN_EMAILS.has((data.email || '').toLowerCase());
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const body = await req.json();
        const { action } = body ?? {};

        switch (action) {
            case 'updateProfile': {
                const { userId, region, subRegion, barangay } = body;
                if (!userId) return json({ error: 'userId is required.' }, 400);

                const { error } = await admin
                    .from('tract_users')
                    .update({ region: region ?? '', sub_region: subRegion || null, barangay: barangay || null })
                    .eq('id', userId);
                if (error) return json({ error: error.message }, 400);
                return json({ ok: true });
            }

            case 'increment': {
                const { userId, amount } = body;
                if (!userId) return json({ error: 'userId is required.' }, 400);
                const inc = Math.max(1, Math.min(1000, Math.floor(Number(amount) || 1)));

                const { data, error } = await admin.rpc('increment_tracts_by', { uid: userId, amount: inc });
                if (error) return json({ error: error.message }, 400);
                return json({ tractsGiven: data });
            }

            case 'adminList': {
                const { requesterId } = body;
                if (!(await requireAdmin(requesterId))) return json({ error: 'Forbidden.' }, 403);

                // PostgREST caps each request at 1000 rows, so page through the
                // full tract_users table to keep dashboard totals accurate.
                const PAGE_SIZE = 1000;
                const users: any[] = [];
                for (let page = 0; ; page++) {
                    const from = page * PAGE_SIZE;
                    const to = from + PAGE_SIZE - 1;
                    const { data, error } = await admin
                        .from('tract_users')
                        .select('id, name, email, region, sub_region, barangay, tracts_given, is_correspondent')
                        .range(from, to);
                    if (error) return json({ error: error.message }, 400);
                    users.push(...(data ?? []));
                    if (!data || data.length < PAGE_SIZE) break;
                }
                return json({ users });
            }

            case 'adminToggleCorrespondent': {
                const { requesterId, userId, value } = body;
                if (!(await requireAdmin(requesterId))) return json({ error: 'Forbidden.' }, 403);
                if (!userId) return json({ error: 'userId is required.' }, 400);

                const { error } = await admin
                    .from('tract_users')
                    .update({ is_correspondent: !!value })
                    .eq('id', userId);
                if (error) return json({ error: error.message }, 400);
                return json({ ok: true });
            }

            case 'adminResetCounts': {
                const { requesterId } = body;
                if (!(await requireAdmin(requesterId))) return json({ error: 'Forbidden.' }, 403);

                const { error } = await admin
                    .from('tract_users')
                    .update({ tracts_given: 0 })
                    .gte('tracts_given', 0);
                if (error) return json({ error: error.message }, 400);
                return json({ ok: true });
            }

            default:
                return json({ error: `Unknown action: ${action}` }, 400);
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('users-api error:', message);
        return json({ error: message }, 500);
    }
});
