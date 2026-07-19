# Developer Onboarding — COG Studio

Welcome. This guide gets you from zero to shipping a change in **one module** of the flagship web app.

> **Start here.** Absolute beginner? Follow [`BUILD_AN_APP_STEP_BY_STEP.md`](./BUILD_AN_APP_STEP_BY_STEP.md) first.  
> Working on **C2S dashboard** as a student team? See [`C2S_STUDENT_DASHBOARD_GUIDE.md`](./C2S_STUDENT_DASHBOARD_GUIDE.md) (also [`.docx`](./C2S_STUDENT_DASHBOARD_GUIDE.docx)).  
> Companion docs: `AGENTS.md`, [`SYSTEM_ARCHITECTURE.md`](./SYSTEM_ARCHITECTURE.md) (architecture + open tasks), `architecture.md`, `CODEBASE_GUIDE.md`, `PLATFORM_ARCHITECTURE.md`. Stack for `apps/web` is Firebase + Prisma/Postgres.

---

## 1. What you are building

**COG Studio** is a church operations platform for Church of God Dasmariñas:

- Worker directory & RBAC
- Sunday scheduling, attendance, meal stubs
- Room reservations & venue assistance
- C2S (Connect2Souls) discipleship groups
- Events, sermons, pastoral requests
- Inventory (Studio module at `/inventory`)
- ORS legacy data sync

### Monorepo layout

```
studio/
├── apps/web/              ← YOU WORK HERE (Next.js 15 App Router)
├── apps/c2s-public/       ← Public C2S Group Finder (port 9004)
├── packages/
│   ├── core-engine/       ← authz, approvals, tenant branding (@studio/core-engine)
│   ├── c2s/               ← C2S domain logic (@studio/c2s)
│   ├── inventory/         ← Inventory domain (@studio/inventory)
│   ├── database/          ← Prisma client export (@studio/database)
│   ├── ui/                ← shared shadcn/ui (@studio/ui)
│   ├── store/             ← Zustand permissions store
│   ├── types/             ← shared TS types
│   ├── client/            ← GraphQL/Apollo client (limited use)
│   └── graphql/           ← GraphQL schema
├── functions/             ← Firebase Cloud Functions (HTTP API + cron)
├── prisma/schema.prisma   ← Postgres schema (source of truth)
├── apphosting.yaml        ← Firebase App Hosting config
└── docs/                  ← this folder
```

> **Sunset:** Tract Tracker (`apps/tract-tracker`) and the standalone
> `apps/inventory` app were removed. Inventory SoT is Studio `/inventory`.

Unless someone assigns you `apps/c2s-public`, **focus on `apps/web`**.

---

## 2. Current stack (apps/web)

| Concern | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| UI | `@studio/ui` (shadcn/Radix), Tailwind, lucide-react |
| Data fetching (client) | TanStack React Query |
| Permissions (client) | Zustand via `@studio/store` + `UserRoleSyncerSQL` |
| Auth | **Firebase Auth** (email/password) |
| Database | **Postgres via Prisma** (`prisma` → `@studio/database/prisma`) |
| Hosting | **Firebase App Hosting** (`apphosting.yaml`) |
| Background / API | Firebase Cloud Functions (`functions/`) |
| Dual-write (soak) | Firestore (optional path; Postgres is still SoT) |

**Not used on the web deploy path anymore:** Supabase Auth client. Hosting is
Firebase App Hosting only (Vercel has been removed from this repo).

Live app: `https://studio--cog-app-studio.asia-southeast1.hosted.app`  
Firebase project: `cog-app-studio`

---

## 3. Local setup (first day)

### Prerequisites

- Node 20+
- npm 11 (see root `packageManager`)
- Docker (for local Postgres) **or** a remote Postgres URL
- Java (only if you run Firebase emulators)
- `firebase-tools` (optional for emulators / Functions)

### Install

```bash
git clone <repo-url>
cd studio
git checkout main
git pull
npm install
npx prisma generate
```

### Postgres

Simplest local DB:

```bash
docker run -d --name cog-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=postgres \
  -p 54322:5432 \
  postgres:15
```

Materialize schema with **`db push`** (migration history is incomplete — do **not** rely on `migrate deploy`):

```bash
# in apps/web/.env.local (or export):
# DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
# DIRECT_URL="postgresql://postgres:postgres@localhost:54322/postgres"
npx prisma db push
```

Seed baseline roles if signup/login needs them (see `claimSystemAdmin` in `apps/web/src/actions/db.ts` and `prisma/seed.ts` / `scripts/seed-admin-worker.ts`).

### Env file

Create `apps/web/.env.local` (gitignored). Minimum:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
DIRECT_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Firebase web config (from Firebase console → Project settings)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cog-app-studio
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Local emulators (optional)
NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199
GCLOUD_PROJECT=cog-app-studio
```

Ask a teammate for a shared `.env.local` template or staging DB URL if you should not invent secrets.

### Firebase Auth emulator (recommended locally)

```bash
firebase emulators:start --only auth,firestore,storage,functions --project cog-app-studio
```

Ports: Auth `9099`, Firestore `8080`, Storage `9199`, Functions `5001`, Emulator UI `4000`.

Create a user in the Auth emulator UI, then ensure a matching `Worker.email` row exists in Postgres (or use ORS sync / seed scripts).

### Run the web app

```bash
npm run dev:web
# → http://localhost:9002
```

### Quality gates before push

```bash
npm run typecheck
# husky pre-push also runs tsc → eslint → next build in apps/web
```

**Gotcha:** never run `next build` while `dev:web` is running — they share `apps/web/.next`. If you do, `rm -rf apps/web/.next` and restart the dev server.

---

## 4. How a feature is structured (the pattern you copy)

Almost every module follows the same vertical slice:

```
UI page / components
    ↓ React Query hook (optional)
Server Action  (apps/web/src/actions/<module>.ts)
    ↓ withPermission / withPublicAction
Service        (apps/web/src/services/<module>.ts)
    ↓
Prisma         (prisma/schema.prisma models)
```

| Layer | Path | Responsibility |
|---|---|---|
| Page | `apps/web/src/app/<route>/page.tsx` | UI only; call actions/hooks |
| Hook | `apps/web/src/hooks/use-*.ts` | React Query wrappers |
| Action | `apps/web/src/actions/<module>.ts` | Auth gate + thin wrapper |
| Service | `apps/web/src/services/<module>.ts` | Business logic + Prisma |
| Schema | `prisma/schema.prisma` | Tables / relations |
| Permissions | `lib/permissions/registry.ts` → `user-role-syncer-sql.tsx` → `nav.tsx` | Who can see/do what |

**Auth wrappers** live in `apps/web/src/lib/auth/with-permission.ts`:

- `withPermission(PERMISSIONS.x.y, handler)` — logged-in + permission key
- `withPublicAction(handler)` — no Worker permission required (public pages, or “any logged-in user” when you check `resolveCallerCtx()` yourself)
- `resolveCallerCtx()` — loads Firebase user → Worker → roles/permissions (cached per request)

**Client permissions** are derived in `apps/web/src/store/user-role-syncer-sql.tsx` and exposed via `useUserRole()`.

---

## 5. Pick one module and own it

Choose **one row**. Stay inside that file set until you understand the flow end-to-end.

| Module | Routes | Actions | Services | Prisma models (approx.) | Good first task |
|---|---|---|---|---|---|
| **C2S** | `/c2s`, `/c2s/my-group`, `/public/c2s-join` (+ standalone `apps/c2s-public`) | `actions/c2s.ts` (+ thin `db.ts` admin wrappers) | `@studio/c2s` | `C2SGroup`, `C2SMentee`, `C2SJoinRequest`, `C2SSession` | Public finder filters; mentor My Group |
| **Workers** | `/workers`, `/workers/[id]` | `actions/db.ts` (`getPaginatedWorkers`, CRUD) | `services/workers.ts` | `Worker`, `WorkerRole`, `Role` | Improve search/sort; profile field UX |
| **Schedule** | `/schedule/*`, `/worker/schedule/*` | `actions/schedule.ts` | `services/schedule.ts`, `master-schedule.ts` | `ServiceSchedule`, `ScheduleAssignment`, `WorshipSlot*` | Template bugfix; publish flow |
| **Reservations** | `/reservations/*`, `/rooms/*` | mostly `actions/db.ts` | `room-reservation-workflow.ts` | `Booking`, `Room` | Calendar UX; approval stage copy |
| **Approvals** | `/approvals` | `actions/db.ts` + domain actions | `approval-engine.ts` | `ApprovalWorkflow`, `ApprovalStage` | New workflow type wiring |
| **Meals / Attendance** | `/meals`, `/mealstub`, `/attendance` | `db.ts` + meal helpers | `meal-stub-*.ts`, `meals-attendance.ts` | `MealStub`, `MealStubLedger`, `AttendanceRecord` | Scanner edge cases |
| **Events** | `/events`, `/public/events` | `actions/events.ts` | `services/events.ts` | `ChurchEvent`, `EventSignup` | Public signup confirmation |
| **Sermons** | `/sermons`, `/public/sermons` | `actions/sermons.ts` | `services/sermons.ts` | `Sermon` | Catalogue fields / public toggle |
| **Inventory (in web)** | `/inventory` | `actions/inventory.ts` | `services/inventory.ts` | `InventoryItem`, `InventoryBorrowing`, … | Borrowing flow polish |
| **ORS Sync** | `/settings/ors-sync` | `actions/ors-sync.ts` | `services/ors-sync.ts` | maps legacy ORS → Prisma | Diff UI / import batch |
| **Settings / RBAC** | `/settings/roles`, … | `db.ts`, `seed-permissions.ts` | `roles.ts` | `Role`, `Permission`, `RolePermission` | New permission key end-to-end |

Full route table: [`architecture.md` §4](./architecture.md).

### Recommended first walkthrough: C2S (public + mentor)

C2S is a clean, modern module with both public and authenticated surfaces.

1. Open `/public/c2s-join` (no login) — list groups, open Join dialog.
2. Read `apps/c2s-public/src/app/page.tsx` → `getPublicC2SGroups` → `listPublicC2SGroups` in `@studio/c2s`. Studio `/public/c2s-join` redirects to `c2sPublicUrl()`.
3. Log in and open `/c2s` / `/c2s/my-group` — mentor group, mentees, sessions, join requests.
4. Trace a join request into `approval-engine.ts` (workflow type for C2S joins).
5. Make a tiny change (copy, filter default, empty state) and verify locally.

---

## 6. Checklist: ship a change in your module

1. **Branch from `main`**
   ```bash
   git checkout main && git pull
   git checkout -b feature/<module>-<short-description>
   ```
2. **Find the vertical slice** (page → action → service → model). Prefer editing the dedicated `actions/<module>.ts` / `services/<module>.ts` over dumping more into `actions/db.ts` when a domain file already exists.
3. **Schema change?** Update `prisma/schema.prisma`, then `npx prisma db push` locally. Coordinate production schema changes with the team (App Hosting Postgres).
4. **New permission?**
   - Add key in `apps/web/src/lib/permissions/registry.ts`
   - Map `can*` flag in `user-role-syncer-sql.tsx` (+ `packages/store` if needed)
   - Gate nav item in `components/layout/nav.tsx`
   - Wrap server action with `withPermission(...)`
5. **UI** — prefer `@studio/ui` primitives; match existing page patterns.
6. **Test manually** on the routes in the module table (happy path + permission denied).
7. **Typecheck** — `npm run typecheck`
8. **PR into `main`** — short description of the module touched and how you verified it.

Commit style: `feat(c2s): ...`, `fix(workers): ...`, `docs: ...`.

---

## 7. Production & deploy awareness

You usually do **not** deploy yourself; merging to `main` triggers App Hosting.

| Surface | How it deploys |
|---|---|
| Web UI (`apps/web`) | Firebase App Hosting watches `main`; build = root `npm run apphosting:build` |
| Cloud Functions | `.github/workflows/firebase-deploy.yml` needs repo secret `FIREBASE_TOKEN` |
| Secrets | App Hosting Secret Manager: `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_FIREBASE_*`, `CRON_SECRET` |

Do **not** put `buildCommand` in `apphosting.yaml` (it strips npm workspaces). Details: `AGENTS.md`.

---

## 8. Docs map (what to read next)

| Doc | When |
|---|---|
| **This file** | Day 1 setup + pick a module |
| [`AGENTS.md`](../AGENTS.md) | Cloud/agent + local gotchas |
| [`architecture.md`](./architecture.md) | Route map & file locations |
| [`CORE_ENGINE_C2S_PLAN.md`](./CORE_ENGINE_C2S_PLAN.md) | Phased plan: core-engine → C2S module → white-label |
| [`PLATFORM_ARCHITECTURE.md`](./PLATFORM_ARCHITECTURE.md) | Approvals, notifications, audit, RBAC layers |
| [`user-stories.md`](./user-stories.md) | What each role can do |
| [`WORKER_RBAC_PLAN.md`](./WORKER_RBAC_PLAN.md) | Worker/role design notes |
| [`ORS_SYNCER_PROMPT.md`](./ORS_SYNCER_PROMPT.md) | Legacy ORS sync context |

---

## 9. Common pitfalls

1. Editing `packages/database` expecting schema there — **schema is root `prisma/schema.prisma`**.
2. Calling privileged Prisma from a page without going through a server action / permission wrapper.
3. Adding a nav link without wiring the permission flag in `user-role-syncer-sql.tsx`.
4. Using Supabase client patterns from old docs — **web uses Firebase Auth + Prisma**.
5. Relying on `fn_workers_search` / `fn_room_bookings_for_date` — they may be missing on App Hosting Postgres; workers already has a Prisma fallback.
6. Building while Turbopack is running (corrupts `.next`).
7. Working in `apps/c2s-public` when the task is for Studio staff features (or vice versa).

---

## 10. Day-1 definition of done

You are onboarded when you can:

- [ ] Run `npm run dev:web` and log in (emulator or staging)
- [ ] Name your assigned module’s **page / action / service / models**
- [ ] Trace one user action from UI → Prisma
- [ ] Open a PR that changes only that module’s files (plus shared types/UI if needed)

If anything in this guide conflicts with the running app, trust the code under `apps/web/src` and update this doc in the same PR.
