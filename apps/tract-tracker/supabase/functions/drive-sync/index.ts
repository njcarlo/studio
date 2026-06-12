/**
 * Supabase Edge Function: drive-sync
 *
 * Admin-only one-time backfill: lists image files in the Google Drive
 * folders used by upload-to-drive, and inserts a correspondent_posts row
 * for any file that doesn't already have a matching drive_file_id — so
 * photos that exist in Drive but were removed from (or never made it
 * into) the feed show up again.
 *
 * Dedup: skips any Drive file whose id already appears as a
 * correspondent_posts.drive_file_id.
 *
 * POST body: { requesterId }
 * Response:  { added: number, skipped: number, total: number }
 *
 * Requires the same secrets as upload-to-drive (GOOGLE_OAUTH_*,
 * GOOGLE_DRIVE_FOLDER_ID, GOOGLE_DRIVE_CORRESPONDENT_FOLDER_ID).
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

const TOKEN_URL = 'https://oauth2.googleapis.com/token';

async function getAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }).toString(),
    });
    const data = await res.json();
    if (!data.access_token) throw new Error(`Token error: ${JSON.stringify(data)}`);
    return data.access_token;
}

interface DriveFile {
    id: string;
    name: string;
    description?: string;
    createdTime: string;
}

async function listImageFiles(folderId: string, accessToken: string): Promise<DriveFile[]> {
    const files: DriveFile[] = [];
    let pageToken: string | undefined;
    do {
        const url = new URL('https://www.googleapis.com/drive/v3/files');
        url.searchParams.set('q', `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`);
        url.searchParams.set('fields', 'nextPageToken, files(id, name, description, createdTime)');
        url.searchParams.set('pageSize', '1000');
        if (pageToken) url.searchParams.set('pageToken', pageToken);

        const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
        const data = await res.json();
        if (!res.ok) throw new Error(`Drive list failed: ${JSON.stringify(data)}`);
        files.push(...(data.files ?? []));
        pageToken = data.nextPageToken;
    } while (pageToken);
    return files;
}

async function makeFilePublic(fileId: string, accessToken: string): Promise<void> {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    });
}

// Drive file descriptions are written by posts-api as:
//   <caption (may span multiple lines)>
//   By: <name>
//   Location: <region> · <barangay>
//   Posted: <ISO timestamp>
function parseDescription(description?: string): {
    caption: string; userName: string; region: string; barangay: string; postedAt?: string;
} {
    if (!description) return { caption: '', userName: 'NTGD Archive', region: '', barangay: '' };

    const byMatch = description.match(/\nBy: (.*)$/m);
    const locationMatch = description.match(/\nLocation: (.*)$/m);
    const postedMatch = description.match(/\nPosted: (.*)$/m);

    const byIdx = description.search(/\nBy: /);
    const caption = (byIdx >= 0 ? description.slice(0, byIdx) : description).trim();

    const [region, barangay] = (locationMatch?.[1] ?? '').split('·').map(s => s.trim());

    return {
        caption,
        userName: byMatch?.[1]?.trim() || 'NTGD Archive',
        region: region && region !== '—' && region !== 'Unknown' ? region : '',
        barangay: barangay && barangay !== '—' ? barangay : '',
        postedAt: postedMatch?.[1]?.trim(),
    };
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { requesterId } = await req.json();
        if (!requesterId) return json({ error: 'requesterId is required.' }, 400);

        const { data: requester } = await admin
            .from('tract_users')
            .select('id, email, is_admin')
            .eq('id', requesterId)
            .maybeSingle();
        const isAdmin = requester?.is_admin === true || ADMIN_EMAILS.has((requester?.email || '').toLowerCase());
        if (!requester || !isAdmin) return json({ error: 'Forbidden.' }, 403);

        const clientId     = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID');
        const clientSecret = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET');
        const refreshToken = Deno.env.get('GOOGLE_OAUTH_REFRESH_TOKEN');
        const folderIds = [Deno.env.get('GOOGLE_DRIVE_FOLDER_ID'), Deno.env.get('GOOGLE_DRIVE_CORRESPONDENT_FOLDER_ID')]
            .filter((id): id is string => !!id);

        if (!clientId || !clientSecret || !refreshToken || folderIds.length === 0) {
            return json({ error: 'Google Drive sync is not configured.' }, 400);
        }

        const accessToken = await getAccessToken(clientId, clientSecret, refreshToken);

        const allFiles: DriveFile[] = [];
        for (const folderId of folderIds) {
            allFiles.push(...await listImageFiles(folderId, accessToken));
        }

        const { data: existing, error: existingErr } = await admin
            .from('correspondent_posts')
            .select('drive_file_id')
            .not('drive_file_id', 'is', null);
        if (existingErr) return json({ error: existingErr.message }, 500);
        const existingIds = new Set((existing ?? []).map((r: { drive_file_id: string }) => r.drive_file_id));

        const missing = allFiles.filter(f => !existingIds.has(f.id));

        let added = 0;
        for (const file of missing) {
            const { caption, userName, region, barangay, postedAt } = parseDescription(file.description);
            const viewUrl = `https://lh3.googleusercontent.com/d/${file.id}`;
            await makeFilePublic(file.id, accessToken).catch(() => {});

            const { error: insertErr } = await admin.from('correspondent_posts').insert({
                user_id: requesterId,
                user_name: userName,
                region,
                barangay,
                image_url: viewUrl,
                caption,
                from_correspondent: true,
                drive_file_id: file.id,
                drive_view_url: viewUrl,
                created_at: postedAt || file.createdTime,
            });
            if (insertErr) {
                console.warn('[drive-sync] insert failed for', file.id, ':', insertErr.message);
                continue;
            }
            added++;
        }

        return json({ added, skipped: allFiles.length - missing.length, total: allFiles.length });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('drive-sync error:', message);
        return json({ error: message }, 500);
    }
});
