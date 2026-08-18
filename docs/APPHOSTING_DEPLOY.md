# App Hosting deploy & settings (Studio)

**Live URL:** https://studio--cog-app-studio.asia-southeast1.hosted.app  
**Firebase project:** `cog-app-studio`  
**Backend id (typical):** `studio`  
**Config file:** `apphosting.yaml` (repo root)

## What deploys where

| Surface | How it deploys |
|---|---|
| **Studio (Next.js)** | Firebase **App Hosting** — auto-builds on push to the linked GitHub branch (`main`) |
| **Cloud Functions / rules** | GitHub Action `Firebase Deploy` — needs repo secret `FIREBASE_TOKEN` |

Today `FIREBASE_TOKEN` is **not** set in GitHub Actions, so Functions deploy is skipped. App Hosting is independent (Firebase console ↔ GitHub).

## Required Secret Manager secrets

In Firebase console → App Hosting → backend **studio** → Secrets (or Google Cloud Secret Manager), these must exist and be linked (see `apphosting.yaml`):

| Secret | Used for |
|---|---|
| `DATABASE_URL` | Prisma (BUILD + RUNTIME) — **required for QA seed** |
| `DIRECT_URL` | Prisma |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Web SDK |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Web SDK |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Web SDK |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Web SDK |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Web SDK |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Web SDK |
| `CRON_SECRET` | `/api/cron/*` (RUNTIME) |

## Plain env settings (in `apphosting.yaml`)

| Variable | Value | Purpose |
|---|---|---|
| `NEXT_PUBLIC_C2S_EMBEDDED` | `true` | Public Group Finder served at `/public/c2s-join` |
| `NEXT_PUBLIC_MODULE_URL_C2S` | Studio `/public/c2s-join` URL | Links stay on one host |
| `NEXT_PUBLIC_STUDIO_URL` | Studio hosted.app URL | Canonical Studio URL |
| `NEXT_PUBLIC_FEATURE_C2S` | `true` | Show C2S in nav |
| `ORS_WEEKLY_WORKERS` | `new` | What the weekly ORS sync does with workers: `new` / `all` / `none` (see below) |
| `ORS_WEEKLY_WORKER_ROLE` | `viewer` | Role given to weekly-imported workers (`viewer` or `worker`) |
| `ORS_WEEKLY_WORKER_LIMIT` | `250` | Max new workers imported per weekly run |
| `TENANT_ID` | `cog-dasma` | Tenant branding key |
| `QA_SEED_ON_DEPLOY` | `true` | Build step seeds C2S QA accounts (set `false` after success) |
| `HOSTNAME` | `0.0.0.0` | Cloud Run bind |

## Trigger a Studio deploy

1. Merge to `main` (App Hosting watches this branch), **or**
2. Firebase console → App Hosting → **studio** → **Roll out** / create rollout from `main`, **or**
3. CLI (needs `firebase login`):

```bash
firebase apphosting:backends:list --project cog-app-studio
firebase apphosting:rollouts:create studio --git-branch main --project cog-app-studio -f
```

Build runs `npm run apphosting:build` → `scripts/apphosting-build.sh`.  
When `QA_SEED_ON_DEPLOY=true`, that script also runs `scripts/seed-qa-accounts-core.ts`.

## After deploy — QA logins

See `docs/PLACEHOLDER_ACCOUNTS.md`:

| Email | Password | Role |
|---|---|---|
| `qa.c2s.mentor@cogdasma.local` | `QaC2sMentor#2026` | Mentor / My Group |
| `qa.c2s.admin@cogdasma.local` | `QaC2sAdmin#2026` | C2S admin |
| `qa.superadmin@cogdasma.local` | `QaSuperAdmin#2026` | Super admin |

Public finder (no login):  
https://studio--cog-app-studio.asia-southeast1.hosted.app/public/c2s-join

## Optional: enable Functions deploy from GitHub

```bash
firebase login:ci   # copy token
gh secret set FIREBASE_TOKEN   # paste token into repo secrets
```

Then pushes to `main` also deploy Functions + rules via `.github/workflows/firebase-deploy.yml`.

## Scheduled jobs

Cloud Scheduler triggers live in `functions/src/index.ts`; each one calls a
Next.js route under `/api/cron/*` with `Authorization: Bearer $CRON_SECRET`.

| Function | Schedule (UTC) | Route |
|---|---|---|
| `dailyJobs` | `0 16 * * *` | `/api/cron/daily-jobs` |
| `venueAssistance` | `0 8 * * *` | `/api/cron/venue-assistance` |
| `weeklyOrsSync` | `0 18 * * 0` (Mon 02:00 Manila) | `/api/cron/ors-weekly-sync` |

### Weekly ORS sync

`weeklyOrsSync` refreshes the legacy ORS reference data — ministries, branches,
areas — and records a worker diff summary (how many ORS workers are new,
changed, or orphaned) so `/settings/ors-sync` can show what's waiting for
review. Every run writes an `OrsSyncRun` row, which is what the sync page's
Sync Status card reads; the job is single-flight, so a retried invocation
becomes a no-op rather than a second concurrent run.

#### Worker handling

`ORS_WEEKLY_WORKERS` decides what the run does with worker records:

| Value | Behaviour |
|---|---|
| `new` (default) | Import ORS workers that don't exist here yet. Purely additive — existing records are never modified. |
| `all` | Also push ORS field changes onto existing workers. **Overwrites live PII** (name, email, phone, address, ministry) from the legacy system. |
| `none` | Change no worker records; just report the diff. |

New workers are created with the `ORS_WEEKLY_WORKER_ROLE` role (`viewer` by
default; only `viewer` and `worker` are accepted, so a typo can't mint
privileged accounts) and their legacy password hash is migrated, matching what
the manual import does. The job scans the entire legacy worker table to find
them — new workers are appended at the end of ORS, so a first-page-only view
would miss exactly the rows it's looking for — and imports at most
`ORS_WEEKLY_WORKER_LIMIT` per run so a large initial backlog can't exhaust the
route's time budget. Anything deferred is reported in the run message and
picked up the following week. The `all` mode uses the same full-table scan
(and the same per-run cap) for field updates on existing workers, so a change
on a row past page 1 of ORS is not skipped.

`ORS_WEEKLY_INCLUDE_WORKERS=true` is still honoured as the old spelling of
`all`, so an environment set before this split keeps its behaviour.

#### Attendance is never included

`AttendanceRecord` has no unique constraint on `(workerProfileId, time)`, so
`createMany({ skipDuplicates: true })` can't actually dedupe scans — a weekly
re-import would multiply every row. Add that constraint before automating
attendance.

To change the day/time, edit the `schedule` on `weeklyOrsSync` and redeploy
Functions. To pause it without a deploy, disable the job in Cloud Scheduler.
