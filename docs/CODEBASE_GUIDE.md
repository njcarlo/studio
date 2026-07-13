# Studio Monorepo — Quick Reference / Navigation Guide

Companion to [`ONBOARDING.md`](./ONBOARDING.md) and [`architecture.md`](./architecture.md).
Stack for **`apps/web`**: Firebase Auth + Firebase App Hosting + Prisma/Postgres
(+ Cloud Functions, Storage, Firestore dual-write soak).

## Monorepo structure

```
/
├── apps/
│   ├── web/              → Next.js 15 (COG App) — Firebase App Hosting
│   └── c2s-public/       → Public C2S Group Finder
├── packages/
│   ├── core-engine/      → Authz, approvals, tenant (@studio/core-engine)
│   ├── c2s/              → C2S domain (@studio/c2s)
│   ├── inventory/        → Inventory domain (@studio/inventory)
│   ├── database/         → Prisma client export (@studio/database)
│   ├── graphql/          → GraphQL schema + resolvers
│   ├── store/            → Zustand (auth permissions, impersonation)
│   ├── types/            → Shared TypeScript types
│   ├── ui/               → Shared UI (shadcn/ui)
│   └── client/           → Apollo/GraphQL client (limited consumers)
├── functions/            → Firebase Cloud Functions (HTTP API + schedulers)
├── prisma/schema.prisma  → Postgres schema (SoT for apps/web)
├── apphosting.yaml       → App Hosting config
├── firebase.json         → Functions, Firestore, Storage, emulators
└── supabase/migrations/  → Historical SQL (indexes/functions) — not web Auth
```

## apps/web — COG App (Next.js)

**Purpose:** Church management for COG Dasmariñas — workers/RBAC, scheduling,
reservations, meals/attendance, approvals, C2S, public pages, ORS sync, inventory.

**Key files:**

| File | Purpose |
|---|---|
| `apps/web/src/app/layout.tsx` | Root layout, fonts, providers |
| `apps/web/src/app/page.tsx` | Redirects to `/login` |
| `apps/web/src/middleware.ts` | Cookie session gate; public prefixes + schedule token route |
| `apps/web/src/lib/firebase-client.ts` | Browser Firebase Auth/SDK (emulator flag) |
| `apps/web/src/lib/firebase-auth-server.ts` | Server `getServerUser()` |
| `apps/web/src/lib/auth/with-permission.ts` | `resolveCallerCtx`, `withPermission`, `withPublicAction` |
| `apps/web/src/actions/*.ts` | Domain server actions |
| `apps/web/src/services/*.ts` | Business logic + Prisma |
| `apps/web/src/store/user-role-syncer-sql.tsx` | Firebase user → Worker → Zustand permissions |
| `apps/web/.env.local` | Local env (Next loads this; not root `.env` alone) |
| `prisma/schema.prisma` | Prisma schema (repo root) |

**Auth: Firebase Auth**

- Login via `signInWithEmailAndPassword` (Firebase web SDK).
- Middleware checks session cookie; unauthenticated users → `/login`.
- `UserRoleSyncerSQL` loads Worker by email and derives `can*` flags.

**Database: Postgres via Prisma**

- `DATABASE_URL` / `DIRECT_URL` in App Hosting secrets and local `.env.local`.
- Fresh local DB: `npx prisma db push` (do not rely on incomplete `migrate deploy`).
- Optional performance SQL still lives under `supabase/migrations/` (apply manually to Postgres).

**Deploy:** Firebase App Hosting from `main`  
URL: `https://studio--cog-app-studio.asia-southeast1.hosted.app`  
Project: `cog-app-studio`

**Routes:** full table in [`architecture.md`](./architecture.md) §4.

## Firebase Cloud Functions (`functions/`)

- Standalone package (own `package.json`).
- HTTP `api` function mounts domain routers under `/<domain>`.
- Auth: `Authorization: Bearer <Firebase ID token>`.
- Schedulers call App Hosting `/api/cron/*` using `APP_BASE_URL` + `CRON_SECRET`.
- Deploy: GitHub Actions `.github/workflows/firebase-deploy.yml` (needs `FIREBASE_TOKEN`) or `firebase deploy --only functions,firestore:rules,storage`.

## Inventory (Studio module)

Lives in **`apps/web`** at `/inventory` (UI + actions). Domain logic is
`@studio/inventory` (Prisma). Permissions: `inventory:access` /
`inventory:manage`. The standalone `apps/inventory` app was **sunset**.

## Known gotchas

1. **`.env` location**: Next.js reads `apps/web/.env.local` (and `.env`), not only the repo root.
2. **Dev vs build**: never `next build` while `npm run dev:web` is running (shared `.next`).
3. **App Hosting**: do not put `buildCommand` in `apphosting.yaml` — it strips npm workspaces.
4. **SQL functions**: `fn_workers_search` / `fn_room_bookings_for_date` may be missing on App Hosting Postgres; workers has a Prisma fallback.
5. **Signup phone**: `Worker.phone` required in schema — signup payload bugs may still exist.
6. **Email**: Resend may still be sandbox (`onboarding@resend.dev`) unless a domain is verified.

## Corrections from older guides

Older copies of this file claimed Supabase Auth / Vercel for `apps/web`. That
path has been removed (no `vercel.json` in the repo). Treat Firebase + Prisma +
App Hosting as current.
