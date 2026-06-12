/**
 * Supabase Edge Function: upload-to-drive
 *
 * Receives a Supabase Storage image URL and backs it up to a Google Drive
 * folder on behalf of a real Google account (via OAuth refresh token).
 * Called fire-and-forget after each correspondent photo upload.
 *
 * Required Supabase secrets (set with `supabase secrets set`):
 *   GOOGLE_OAUTH_CLIENT_ID                 – OAuth 2.0 client ID
 *   GOOGLE_OAUTH_CLIENT_SECRET             – OAuth 2.0 client secret
 *   GOOGLE_OAUTH_REFRESH_TOKEN             – refresh token for the Drive account (scope: drive.file)
 *   GOOGLE_DRIVE_FOLDER_ID                 – ID of the regular-user photos folder
 *   GOOGLE_DRIVE_CORRESPONDENT_FOLDER_ID   – ID of the correspondents folder (full-res, unlimited)
 *
 * Setup steps:
 *   1. Google Cloud Console → create an OAuth 2.0 Client ID (Web application)
 *   2. Use https://developers.google.com/oauthplayground with your own
 *      client ID/secret (gear icon → "Use your own OAuth credentials") to
 *      authorize scope https://www.googleapis.com/auth/drive.file as the
 *      Google account that owns the destination folders, then exchange the
 *      auth code for a refresh token.
 *   3. Google Drive → create the destination folder(s) under that same account
 *   4. Copy the folder ID from the URL (the long string after /folders/)
 *   5. supabase secrets set GOOGLE_OAUTH_CLIENT_ID='<client id>' GOOGLE_OAUTH_CLIENT_SECRET='<client secret>' GOOGLE_OAUTH_REFRESH_TOKEN='<refresh token>'
 *   6. supabase secrets set GOOGLE_DRIVE_FOLDER_ID='<folder-id>'
 *   7. supabase functions deploy upload-to-drive
 *
 * FILO deletion:
 *   Files are named  YYYY-MM-DDTHH-MM-SS_UserName.jpg
 *   In Google Drive, sort by Name descending → delete from the top to remove
 *   the most recent uploads first (Last In, First Out).
 */

const TOKEN_URL  = 'https://oauth2.googleapis.com/token';
const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

// ── Google OAuth refresh-token exchange ───────────────────────────────────────

async function getAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
    const res  = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }).toString(),
    });
    const json = await res.json();
    if (!json.access_token) throw new Error(`Token error: ${JSON.stringify(json)}`);
    return json.access_token;
}

// ── Drive upload ──────────────────────────────────────────────────────────────

async function uploadToDrive(
    imageUrl: string,
    fileName: string,
    accessToken: string,
    folderId: string,
): Promise<string> {
    // Download the image from Supabase Storage
    const imgRes  = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error(`Image fetch failed: ${imgRes.status}`);
    const imgBuf  = await imgRes.arrayBuffer();

    // Build a multipart/related body manually (FormData can't set part Content-Types reliably in Deno)
    const boundary = `ntgd_${Date.now()}`;
    const meta     = JSON.stringify({ name: fileName, parents: folderId ? [folderId] : [] });
    const encoder  = new TextEncoder();

    const parts = [
        encoder.encode(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n`),
        encoder.encode(`--${boundary}\r\nContent-Type: image/jpeg\r\n\r\n`),
        new Uint8Array(imgBuf),
        encoder.encode(`\r\n--${boundary}--`),
    ];

    const total = parts.reduce((n, p) => n + p.length, 0);
    const body  = new Uint8Array(total);
    let offset  = 0;
    for (const part of parts) { body.set(part, offset); offset += part.length; }

    const uploadRes = await fetch(UPLOAD_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
    });
    const uploadJson = await uploadRes.json();
    if (!uploadRes.ok) throw new Error(`Drive upload failed: ${JSON.stringify(uploadJson)}`);
    return uploadJson.id as string;
}

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { imageUrl, fileName, isCorrespondent } =
            await req.json() as { imageUrl: string; fileName: string; isCorrespondent?: boolean };
        if (!imageUrl || !fileName) {
            return new Response(JSON.stringify({ error: 'imageUrl and fileName are required' }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const clientId     = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID');
        const clientSecret = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET');
        const refreshToken = Deno.env.get('GOOGLE_OAUTH_REFRESH_TOKEN');

        // Correspondents go to their own folder (falls back to main folder if not set)
        const folderId = isCorrespondent
            ? (Deno.env.get('GOOGLE_DRIVE_CORRESPONDENT_FOLDER_ID') ?? Deno.env.get('GOOGLE_DRIVE_FOLDER_ID') ?? '')
            : (Deno.env.get('GOOGLE_DRIVE_FOLDER_ID') ?? '');

        if (!clientId || !clientSecret || !refreshToken) {
            // Secrets not configured — silently skip (don't break the upload flow)
            console.warn('Google OAuth secrets not set; Drive backup skipped.');
            return new Response(JSON.stringify({ skipped: true }), {
                status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const accessToken = await getAccessToken(clientId, clientSecret, refreshToken);
        const fileId       = await uploadToDrive(imageUrl, fileName, accessToken, folderId);

        return new Response(JSON.stringify({ fileId }), {
            status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('upload-to-drive error:', message);
        // Return 200 so the app doesn't treat this as a fatal error
        return new Response(JSON.stringify({ error: message }), {
            status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
