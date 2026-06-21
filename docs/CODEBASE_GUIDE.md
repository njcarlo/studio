# Studio Monorepo — Quick Reference / Navigation Guide

> Migrated from the repo-root `CODEBASE_GUIDE.txt` and corrected against the
> current codebase (that file had drifted — see "Corrections" below). For the
> authoritative, actively-maintained architecture map, see
> [architecture.md](./architecture.md); this file is a faster-to-skim
> orientation companion.

## Monorepo structure

```
/
├── apps/
│   ├── web/              → Next.js 15 web app (COG App - church management)
│   └── tract-tracker/    → Expo React Native app (COG Nation Tracts Giving Day)
├── packages/
│   ├── database/         → Supabase client + Prisma providers
│   ├── graphql/          → GraphQL schema + resolvers
│   ├── store/            → Zustand stores (auth, permissions, impersonation)
│   ├── types/            → Shared TypeScript types
│   └── ui/                → Shared UI components (shadcn/ui based)
└── turbo.json            → Turborepo config
```

## apps/web — COG App (Next.js)

**Purpose:** Church management system for COG Dasmariñas — worker profiles,
roles/ministries, scheduling, room reservations, meal stubs, attendance, QR
scanning, approvals, C2S discipleship groups, public attendee-facing module,
ORS legacy data sync, inventory.

**Key files:**
| File | Purpose |
|---|---|
| `apps/web/src/app/layout.tsx` | Root layout, fonts, providers |
| `apps/web/src/app/page.tsx` | Redirects to `/login` |
| `apps/web/src/app/auth-sync.tsx` | Auth bootstrap component (Supabase session → Zustand) |
| `apps/web/src/middleware.ts` | Edge auth gate — redirects unauthenticated requests to `/login` except for `PUBLIC_PREFIXES` and the token-shareable `/worker/schedule/[token]` route |
| `apps/web/src/actions/db.ts` | Large grab-bag of Prisma server actions (workers, ministries, rooms, etc.) |
| `apps/web/src/actions/*.ts` | One file per domain area — thin auth-check-then-call-service wrappers (see [architecture.md](./architecture.md)) |
| `apps/web/src/services/*.ts` | Actual business logic + Prisma queries |
| `apps/web/src/store/user-role-syncer-sql.tsx` | Syncs Supabase user → Prisma worker → permissions |
| `apps/web/.env` | Env vars (Supabase DB + API, Resend) — **note:** Next.js reads this file, not the repo-root `.env`; keep both in sync if you maintain a root copy |
| `prisma/schema.prisma` | Prisma schema (repo root, not `packages/database`) |

**Auth: Supabase Auth** (not Firebase — the old guide was wrong on this).
- Login/signup via `supabase.auth.signInWithPassword` (`@studio/database` client).
- `middleware.ts` reads the session cookie at the edge and redirects unauthenticated
  requests before they reach a serverless function.
- `UserRoleSyncerSQL` reads the Supabase user to fetch the worker profile from Prisma
  and compute permissions into the Zustand store.

**Database:** Supabase PostgreSQL via Prisma.
- `DATABASE_URL` — pooled connection (pgbouncer, port 6543) for app queries.
- `DIRECT_URL` — direct connection (port 5432) for migrations.
- Both must be updated in **three places** when the password rotates:
  repo-root `.env`, `apps/web/.env` (the one Next.js actually loads at build/runtime —
  easy to miss), and Vercel project env vars (Production/Preview/Development).

**Routes:** see the full table in [architecture.md](./architecture.md)
— it's kept current; don't duplicate it here.

## apps/tract-tracker — Tracts Giving Day (Expo React Native)

**Purpose:** Mobile app for tracking gospel tract distribution — log in,
select region/barangay, tap +1 to record tracts given; regional + personal
counts; map view; admin dashboard.

**Key files:**
| File | Purpose |
|---|---|
| `apps/tract-tracker/src/supabase.ts` | Supabase client + admin client |
| `apps/tract-tracker/src/context/AuthContext.tsx` | Auth state, signIn/signUp/signOut |
| `apps/tract-tracker/src/AppNavigator.tsx` | Navigation (Stack + BottomTabs) |
| `apps/tract-tracker/src/screens/ActionScreen.tsx` | Main screen (counter + +1 button) |
| `apps/tract-tracker/src/screens/MapScreen.tsx` | Leaflet map (OpenStreetMap, no API key) |
| `apps/tract-tracker/src/screens/AdminDashboardScreen.tsx` | Admin user management |
| `apps/tract-tracker/supabase/migrations/001_create_tract_users.sql` | DB schema |

**Auth:** Supabase Auth (`signInWithPassword`/`signUp`); session persisted via
the Supabase client. `AppNavigator` swaps screens based on session state —
**do not** call `navigation.replace()` after login/signup, the session change
triggers the swap automatically.

**Database:** Same Supabase project as `apps/web`.
- Table `tract_users`: `id, user_id, name, email, region, sub_region, barangay, tracts_given`
- RPC `increment_tracts(uid)` — increments `tracts_given` by 1.

**Map:** `react-native-webview` + Leaflet.js + OpenStreetMap tiles — no Google
Maps API key required. Barangay coordinates are hardcoded in `MapScreen.tsx`.

**Build:** EAS project `@jace29/tract-tracker`; bundle ID `com.cognation.tracks`
(both platforms).

## Supabase project

One Supabase project backs **both** apps:
- `apps/web` uses it as a PostgreSQL database via Prisma, plus Supabase Auth
  (`@supabase/ssr` in middleware, `@studio/database` client elsewhere).
- `apps/tract-tracker` uses the Supabase client SDK directly for auth and
  table queries (no Prisma).

Region: `ap-northeast-1` (AWS).

## Known issues / watch out for

1. **Metro cache** in tract-tracker: run `npx expo start --clear` after file
   changes to avoid stale cache.
2. **`.env` duplication**: the repo-root `.env` and `apps/web/.env` both hold
   `DATABASE_URL`/`DIRECT_URL` — Next.js only reads the one in `apps/web/`.
   Forgetting to update both after a password rotation causes the pre-push
   build to fail with a Prisma auth error even though the root `.env` looks correct.
3. **Email sender** is Resend sandbox (`onboarding@resend.dev`) unless a
   verified domain has since been configured — check before relying on
   production email delivery.

## Corrections from the original `CODEBASE_GUIDE.txt`

The repo-root version (dated "March 15, 2026") had drifted from reality by the
time this was migrated:
- Claimed **Firebase Auth** — the app actually runs on **Supabase Auth** end to end
  (login page, middleware, `UserRoleSyncerSQL`). No Firebase code remains in the auth path.
- Claimed `ignoreBuildErrors: true` in `next.config.ts` — it's `false`.
- Referenced `/api/debug-prisma` and `/api/debug-workers` debug routes and a
  root-level `service-account.json` — neither exists in the current tree.
- Listed a much shorter route table and hook list than what exists today —
  defer to [architecture.md](./architecture.md), which is updated alongside
  feature work, rather than maintaining a second route list here.
