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
