import express from 'express';
import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret, defineString } from 'firebase-functions/params';
import { adminApp } from './lib/firebase';
import { requireAuth } from './lib/http';
import { workers } from './routes/workers';
import { meals } from './routes/meals';
import { approvals } from './routes/approvals';
import { attendance } from './routes/attendance';
import { c2s } from './routes/c2s';
import { ministries } from './routes/ministries';
import { settings } from './routes/settings';
import { schedule } from './routes/schedule';
import { venue } from './routes/venue';
import { inventory } from './routes/inventory';

// Runtime config. On deploy these bind to Secret Manager / env params and are
// injected into process.env; in the emulator they come from functions/.env.
const DATABASE_URL = defineSecret('DATABASE_URL');
const DIRECT_URL = defineSecret('DIRECT_URL');
const CRON_SECRET = defineSecret('CRON_SECRET');
// Empty default so `firebase deploy` never prompts. Set it to the App Hosting
// URL once the backend exists (env/param); until then the cron calls no-op.
const APP_BASE_URL = defineString('APP_BASE_URL', { default: '' });

adminApp();

const app = express();
app.use(express.json());

// CORS — mirrors the former supabase/functions/_shared/cors.ts.
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).send('');
  next();
});

// Unauthenticated health check.
app.get('/healthz', (_req, res) => { res.json({ ok: true }); });

// Everything else requires a valid Firebase ID token.
app.use(requireAuth);

// Each domain keeps the same route surface the Supabase Edge Function exposed,
// now under a single HTTP function mounted at /<domain>.
app.use('/workers', workers);
app.use('/meals', meals);
app.use('/approvals', approvals);
app.use('/attendance', attendance);
app.use('/c2s', c2s);
app.use('/ministries', ministries);
app.use('/settings', settings);
app.use('/schedule', schedule);
app.use('/venue', venue);
app.use('/inventory', inventory);

app.use((_req, res) => { res.status(404).json({ error: 'Route not found' }); });

/**
 * Single HTTPS function fronting the whole REST API (replaces the 10 separate
 * Supabase Edge Functions). Deployed at https://<region>-<project>.cloudfunctions.net/api
 */
export const api = onRequest(
  { region: 'us-central1', memory: '512MiB', secrets: [DATABASE_URL, DIRECT_URL] },
  app,
);

// ── Scheduled jobs (replace vercel.json crons) ────────────────────────────
// Trigger the Next.js cron endpoints (served by Firebase App Hosting) using
// the same CRON_SECRET bearer contract they already enforce. Times are UTC to
// match the previous Vercel cron schedules.
async function callCron(path: string): Promise<void> {
  const base = APP_BASE_URL.value() || process.env.APP_BASE_URL;
  const secret = process.env.CRON_SECRET;
  if (!base || !secret) {
    console.error(`[cron] APP_BASE_URL or CRON_SECRET not set — skipping ${path}`);
    return;
  }
  const resp = await fetch(`${base}${path}`, { headers: { Authorization: `Bearer ${secret}` } });
  const body = await resp.text();
  console.log(`[cron] ${path} -> ${resp.status} ${body.slice(0, 500)}`);
  if (!resp.ok) throw new Error(`${path} returned ${resp.status}`);
}

export const dailyJobs = onSchedule(
  { schedule: '0 16 * * *', timeZone: 'Etc/UTC', region: 'us-central1', secrets: [CRON_SECRET] },
  async () => { await callCron('/api/cron/daily-jobs'); },
);

export const venueAssistance = onSchedule(
  { schedule: '0 8 * * *', timeZone: 'Etc/UTC', region: 'us-central1', secrets: [CRON_SECRET] },
  async () => { await callCron('/api/cron/venue-assistance'); },
);
