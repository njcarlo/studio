/**
 * Supabase Edge Function: posts-api
 *
 * Server-side validation + writes for correspondent_posts. Runs with the
 * service-role key (auto-injected, never sent to the client) so it can
 * enforce upload-slot limits and ownership/admin checks that the client
 * cannot be trusted to enforce on its own.
 *
 * Actions (POST body: { action, ...params }):
 *   create  { userId, imageUrl, caption }      -> { post, isCorrespondent }
 *   delete  { requesterId, postId }            -> { ok }
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

// Mirrors AuthContext.tsx ADMIN_EMAILS — emails treated as admin/correspondent without a DB flag.
const ADMIN_EMAILS = new Set(['njcarlo@gmail.com', 'cogtv@gmail.com']);

const REGULAR_MAX_POSTS    = 1;
const REGULAR_UPLOAD_SLOTS = 500;
const AUTO_HASHTAGS = '\n\n#NationalTractsGivingDay\n#OutsideIsBeautiful\n#Connect2Souls\n#BornAgainPilipinas';

interface UserRow {
    id: string; name: string | null; email: string | null;
    region: string | null; barangay: string | null;
    is_correspondent: boolean | null; is_admin: boolean | null;
}

function isPrivileged(user: UserRow): boolean {
    const email = (user.email || '').toLowerCase();
    return user.is_correspondent === true || user.is_admin === true || ADMIN_EMAILS.has(email);
}

function storagePathFromUrl(imageUrl: string): string | null {
    try {
        const path = new URL(imageUrl).pathname;
        return path.split('/correspondent-photos/').at(-1) ?? null;
    } catch {
        return null;
    }
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const body = await req.json();
        const { action } = body ?? {};

        switch (action) {
            case 'create': {
                const { userId, imageUrl, caption } = body;
                if (!userId || !imageUrl) return json({ error: 'userId and imageUrl are required.' }, 400);

                const { data: user, error: userErr } = await admin
                    .from('tract_users')
                    .select('id, name, email, region, barangay, is_correspondent, is_admin')
                    .eq('id', userId)
                    .single();
                if (userErr || !user) return json({ error: 'User not found.' }, 404);

                const isCorrespondent = isPrivileged(user as UserRow);

                if (!isCorrespondent) {
                    const { count: myCount } = await admin
                        .from('correspondent_posts')
                        .select('id', { count: 'exact', head: true })
                        .eq('user_id', userId);
                    if ((myCount ?? 0) >= REGULAR_MAX_POSTS) {
                        return json({ error: "You've already shared your photo. Thank you!" }, 403);
                    }

                    const { count: totalRegular } = await admin
                        .from('correspondent_posts')
                        .select('id', { count: 'exact', head: true })
                        .eq('from_correspondent', false);
                    if ((totalRegular ?? 0) >= REGULAR_UPLOAD_SLOTS) {
                        return json({ error: 'All upload slots have been claimed. Thank you!' }, 403);
                    }
                }

                const trimmedCaption = (typeof caption === 'string' ? caption.trim() : '') + AUTO_HASHTAGS;

                const { data: post, error: insertErr } = await admin
                    .from('correspondent_posts')
                    .insert({
                        user_id: user.id,
                        user_name: user.name || user.email,
                        region: user.region || '',
                        barangay: user.barangay || '',
                        image_url: imageUrl,
                        caption: trimmedCaption,
                        from_correspondent: isCorrespondent,
                    })
                    .select()
                    .single();
                if (insertErr || !post) return json({ error: insertErr?.message || 'Failed to save post.' }, 400);

                return json({ post, isCorrespondent });
            }

            case 'delete': {
                const { requesterId, postId } = body;
                if (!requesterId || !postId) return json({ error: 'requesterId and postId are required.' }, 400);

                const [{ data: requester }, { data: post }] = await Promise.all([
                    admin.from('tract_users').select('id, email, is_admin').eq('id', requesterId).maybeSingle(),
                    admin.from('correspondent_posts').select('id, user_id, image_url').eq('id', postId).maybeSingle(),
                ]);
                if (!requester) return json({ error: 'Requester not found.' }, 404);
                if (!post) return json({ error: 'Post not found.' }, 404);

                const isOwner = requester.id === post.user_id;
                const isAdmin = requester.is_admin === true || ADMIN_EMAILS.has((requester.email || '').toLowerCase());
                if (!isOwner && !isAdmin) return json({ error: 'Forbidden.' }, 403);

                await admin.from('correspondent_posts').delete().eq('id', postId);
                const storagePath = storagePathFromUrl(post.image_url);
                if (storagePath) await admin.storage.from('correspondent-photos').remove([storagePath]);

                return json({ ok: true });
            }

            default:
                return json({ error: `Unknown action: ${action}` }, 400);
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('posts-api error:', message);
        return json({ error: message }, 500);
    }
});
