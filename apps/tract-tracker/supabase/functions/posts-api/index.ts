/**
 * Supabase Edge Function: posts-api
 *
 * Server-side validation + writes for correspondent_posts. Runs with the
 * service-role key (auto-injected, never sent to the client) so it can
 * enforce ownership/admin checks that the client cannot be trusted to
 * enforce on its own.
 *
 * Actions (POST body: { action, ...params }):
 *   create  { userId, imageUrl, caption }      -> { post, isCorrespondent }
 *   delete  { requesterId, postId }            -> { ok }
 *
 * After every successful create, checks total usage of the correspondent-photos
 * bucket and — once it crosses STORAGE_THRESHOLD_BYTES (~700MB, ~70% of the 1GB
 * free-tier limit) — deletes the oldest posts first (FIFO) until back under it.
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

const AUTO_HASHTAGS = '\n\n#NationalTractsGivingDay\n#OutsideIsBeautiful\n#Connect2Souls\n#BornAgainPilipinas';

// ~70% of the 1GB free-tier Supabase Storage limit. Crossing this triggers FIFO
// cleanup of correspondent-photos (oldest posts first) so uploads can keep flowing.
// Google Drive backups are never touched — Drive is the permanent archive.
const STORAGE_THRESHOLD_BYTES   = 700 * 1024 * 1024;
const MAX_FIFO_DELETIONS_PER_RUN = 25;

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

// Calls upload-to-drive and returns the resulting Drive file ID, or null if
// the backup didn't succeed (missing secrets, Drive error, etc).
async function backupToDrive(imageUrl: string, fileName: string, isCorrespondent: boolean, description?: string): Promise<{ fileId: string; viewUrl: string } | null> {
    try {
        const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/upload-to-drive`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageUrl, fileName, isCorrespondent, description }),
        });
        const data = await res.json();
        return typeof data?.fileId === 'string' ? { fileId: data.fileId, viewUrl: data.viewUrl } : null;
    } catch (e) {
        console.warn('[Drive] backup error:', e);
        return null;
    }
}

// Archives the oldest correspondent_posts one at a time, re-checking total
// bucket usage after each, until back under the threshold. The DB row is
// kept (so it stays visible in the feed/history) — only the Storage object
// is removed, and image_url is repointed at the publicly-viewable Drive
// copy. Only posts with a confirmed Drive backup (drive_file_id +
// drive_view_url) and still pointing at correspondent-photos are eligible.
async function enforceFifoStorageLimit(): Promise<void> {
    for (let i = 0; i < MAX_FIFO_DELETIONS_PER_RUN; i++) {
        const { data: totalBytes, error: usageErr } = await admin.rpc('correspondent_storage_bytes');
        if (usageErr) { console.warn('[FIFO] usage check failed:', usageErr.message); return; }
        if (typeof totalBytes !== 'number' || totalBytes <= STORAGE_THRESHOLD_BYTES) return;

        const { data: oldest } = await admin
            .from('correspondent_posts')
            .select('id, image_url, drive_view_url')
            .not('drive_file_id', 'is', null)
            .not('drive_view_url', 'is', null)
            .like('image_url', '%/correspondent-photos/%')
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();
        if (!oldest) {
            console.warn('[FIFO] storage over threshold but no posts with confirmed Drive backup to archive');
            return;
        }

        const storagePath = storagePathFromUrl(oldest.image_url);
        await admin.from('correspondent_posts').update({ image_url: oldest.drive_view_url }).eq('id', oldest.id);
        if (storagePath) await admin.storage.from('correspondent-photos').remove([storagePath]);
        console.log('[FIFO] archived oldest backed-up post', oldest.id, 'to stay under storage threshold');
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

                const driveFileName =
                    `${new Date(post.created_at).toISOString().slice(0, 19).replace(/[T:]/g, '-')}_` +
                    `${(user.name || user.email || post.id).replace(/\s+/g, '_')}.jpg`;
                const driveDescription = [
                    trimmedCaption,
                    `By: ${user.name || user.email || 'Unknown'}`,
                    `Location: ${[post.region, post.barangay].filter(Boolean).join(' · ') || 'Unknown'}`,
                    `Posted: ${post.created_at}`,
                ].join('\n');
                const backup = await backupToDrive(imageUrl, driveFileName, isCorrespondent, driveDescription);
                if (backup) {
                    await admin.from('correspondent_posts').update({
                        drive_file_id: backup.fileId,
                        drive_view_url: backup.viewUrl,
                    }).eq('id', post.id);
                    post.drive_file_id = backup.fileId;
                    post.drive_view_url = backup.viewUrl;
                } else {
                    console.warn('[Drive] backup failed for post', post.id, '— excluded from FIFO cleanup until backed up');
                }

                enforceFifoStorageLimit().catch(e => console.warn('[FIFO] cleanup error:', e));

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
