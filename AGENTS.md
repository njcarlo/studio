# AGENTS.md

## Cursor Cloud specific instructions

Turborepo + npm-workspaces monorepo (`apps/web` is the flagship Next.js app;
`apps/c2s-public` Group Finder; `apps/inventory`; shared `packages/*` including
`@studio/core-engine` and `@studio/c2s`).

**Module URLs** use `https://[module].[domain].app` via `NEXT_PUBLIC_ROOT_DOMAIN`
(default `cogdasma.app`) — e.g. `c2s.cogdasma.app`, `studio.cogdasma.app`.
Helpers: `moduleAppUrl` / `c2sPublicUrl` in `@studio/core-engine/tenant`.

**`apps/web` is on Firebase end-to-end:** Auth is **Firebase Auth**, hosting is
**Firebase App Hosting** (`apphosting.yaml`), background jobs / HTTP API are
**Firebase Cloud Functions** (`functions/`), uploads use **Firebase Storage**,
and writes dual-write to **Firestore**. **Postgres (via Prisma) remains the
source of truth** during the dual-write soak. Hosting is Firebase App Hosting
only (no Vercel). `apps/inventory` is a separate product app (may still
reference Supabase until migrated). Tract Tracker has been **sunset** and
removed from this repo.

The update script already runs `npm install` + `npx prisma generate` (root). The
notes below are the non-obvious bits.

### Local services

Two backing services are needed to run `apps/web` end-to-end locally:

1. **Postgres** (Prisma). Any local Postgres works. Simplest:
   `docker run -d --name cog-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=postgres -p 54322:5432 postgres:15`
   The Prisma **migration history is incomplete** (the live DB was built with
   `db push` / Supabase SQL). To materialize a fresh dev DB use
   `npx prisma db push` — **not** `migrate deploy` (it fails on
   `ScheduleAssignment`). Default roles for signup: seed `admin/approver/editor/viewer`
   rows into `Role` (see `claimSystemAdmin` in `apps/web/src/actions/db.ts`).
2. **Firebase Emulator Suite** (`firebase-tools`, needs Java — present on the VM):
   `firebase emulators:start --only auth,firestore,storage,functions --project cog-app-studio`
   (Auth 9099, Firestore 8080, Storage 9199, Functions 5001, UI 4000).

Env for `apps/web` lives in `apps/web/.env.local` (gitignored): local
`DATABASE_URL`/`DIRECT_URL`, placeholder `NEXT_PUBLIC_FIREBASE_*`,
`NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true`, and the Admin SDK
`*_EMULATOR_HOST` + `GCLOUD_PROJECT` vars. The **web SDK only talks to the
emulators when `NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true`** (see
`apps/web/src/lib/firebase-client.ts`); the Admin SDK auto-detects the
`*_EMULATOR_HOST` vars.

### Run / build / test

- Dev server: `npm run dev:web` (Turbopack, port 9002). Standard commands live in
  `apps/web/package.json` and root `package.json`.
- **Gotcha:** never run `next build` while the Turbopack dev server is running —
  they share `apps/web/.next` and the dev server then 500s with a missing
  `_buildManifest` chunk. After any `next build`, `rm -rf apps/web/.next` and
  restart `npm run dev:web`.
- The **`pre-push` husky hook** runs `tsc --noEmit` → `eslint` → `next build`
  (in `apps/web`); all three must pass or the push is blocked. Run
  `npm run typecheck` before pushing.
- Signup (`/signup`) currently fails because `Worker.phone` is required in the
  schema but the payload omits it — a **pre-existing schema-drift bug on `main`
  too**, unrelated to the Firebase migration.

### Firebase Cloud Functions (`functions/`)

Standalone package (own `package.json`, not a workspace) — the deploy artifact.
Build/typecheck: `cd functions && npm install && npm run build`. The Prisma
client must be generated for it: `npm run prisma:generate` writes to the nearest
`@prisma/client` (the repo-root one is fine for the emulator). For an isolated
deploy bundle, generate the client into `functions/node_modules` (Firebase's
`predeploy` in `firebase.json` runs `prisma:generate` + `build`). Auth is a
Firebase ID token (`Authorization: Bearer <token>`); the `api` HTTP function
mounts one router per domain under `/<domain>`. Shared helpers live in
`functions/src/lib/` (`firebase.ts`, `http.ts`, `prisma.ts`).

### Production deploy

1. **App Hosting** — link a backend in the Firebase console to this GitHub repo
   (project `cog-app-studio`). Root directory must be `/` (repo root). It reads
   `apphosting.yaml` + the root `apphosting:build` script in `package.json`.
   Do **not** put `buildCommand` in `apphosting.yaml` — that strips npm
   `workspaces` (see firebase/apphosting-adapters#569). Populate Secret Manager
   with `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_FIREBASE_*`, and `CRON_SECRET`.
2. **Cloud Functions** — set GitHub Actions secret `FIREBASE_TOKEN`
   (`firebase login:ci`) so `.github/workflows/firebase-deploy.yml` can run on
   `main`, or deploy locally with
   `firebase deploy --only functions,firestore:rules,storage`.
3. Set the Cloud Functions `APP_BASE_URL` param to the App Hosting URL so the
   scheduled jobs can call `/api/cron/*`.
4. **PR checks** — `.github/workflows/firebase-pr.yml` (“Firebase”) validates
   App Hosting config. There is no Vercel config in this repo.
