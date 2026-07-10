# AGENTS.md

## Cursor Cloud specific instructions

Turborepo + npm-workspaces monorepo (`apps/web` is the flagship Next.js app;
`apps/inventory`, `apps/tract-tracker`; shared `packages/*`). This repo is
mid-migration **Supabase → Firebase**: on the `firebase-migration` line, Auth is
cut over to **Firebase Auth**, writes dual-write to **Firestore**, and
**Postgres (via Prisma) is still the source of truth**. Deployment/hosting is
**Firebase App Hosting** (`apphosting.yaml`); the former Supabase Edge Functions
are now **Firebase Cloud Functions** in `functions/`.

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
mounts one router per domain under `/<domain>`.
