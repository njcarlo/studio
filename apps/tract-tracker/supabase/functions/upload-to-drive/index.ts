/**
 * Supabase Edge Function: upload-to-drive
 *
 * Receives a Supabase Storage image URL and backs it up to a Google Drive
 * folder using a service account. Called fire-and-forget after each
 * correspondent photo upload.
 *
 * Required Supabase secrets (set with `supabase secrets set`):
 *   GOOGLE_SERVICE_ACCOUNT_KEY             – full JSON string of the service account key
 *   GOOGLE_DRIVE_FOLDER_ID                 – ID of the regular-user photos folder
 *   GOOGLE_DRIVE_CORRESPONDENT_FOLDER_ID   – ID of the correspondents folder (full-res, unlimited)
 *
 * Setup steps:
 *   1. Google Cloud Console → create a project → enable "Google Drive API"
 *   2. IAM → Service Accounts → create one → download JSON key
 *   3. Google Drive → create a folder → Share it with the service account email
 *   4. Copy the folder ID from the URL (the long string after /folders/)
 *   5. supabase secrets set GOOGLE_SERVICE_ACCOUNT_KEY='<paste full JSON>'
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

// ── Google service-account JWT ────────────────────────────────────────────────

function base64url(data: Uint8Array | string): string {
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function signedJWT(clientEmail: string, privateKeyPem: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const header  = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payload = base64url(JSON.stringify({
        iss:   clientEmail,
        scope: 'https://www.googleapis.com/auth/drive.file',
        aud:   TOKEN_URL,
        iat:   now,
        exp:   now + 3600,
    }));

    // Strip PEM armor and import the PKCS8 private key
    const pemBody  = privateKeyPem
        .replace(/\\n/g, '\n')
        .replace(/-----BEGIN PRIVATE KEY-----/g, '')
        .replace(/-----END PRIVATE KEY-----/g, '')
        .replace(/\s/g, '');
    const derBytes = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey(
        'pkcs8', derBytes.buffer,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false, ['sign'],
    );

    const sigInput = `${header}.${payload}`;
    const sigBytes = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5', cryptoKey,
        new TextEncoder().encode(sigInput),
    );
    return `${sigInput}.${base64url(new Uint8Array(sigBytes))}`;
}

async function getAccessToken(key: { client_email: string; private_key: string }): Promise<string> {
    const jwt = await signedJWT(key.client_email, key.private_key);
    const res  = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
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

        const rawKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');

        // Correspondents go to their own folder (falls back to main folder if not set)
        const folderId = isCorrespondent
            ? (Deno.env.get('GOOGLE_DRIVE_CORRESPONDENT_FOLDER_ID') ?? Deno.env.get('GOOGLE_DRIVE_FOLDER_ID') ?? '')
            : (Deno.env.get('GOOGLE_DRIVE_FOLDER_ID') ?? '');

        if (!rawKey) {
            // Secrets not configured — silently skip (don't break the upload flow)
            console.warn('GOOGLE_SERVICE_ACCOUNT_KEY not set; Drive backup skipped.');
            return new Response(JSON.stringify({ skipped: true }), {
                status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const serviceKey   = JSON.parse(rawKey);
        const accessToken  = await getAccessToken(serviceKey);
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
