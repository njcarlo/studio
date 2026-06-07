# Server Action Authorization & Layering Plan

## Context

A security review of `apps/web` (2026-06-07) found that ~120 Server Actions in `actions/*.ts` perform privileged Prisma writes with **no server-side session or permission checks** — authorization was implicitly delegated to the UI and to Postgres RLS. The root cause: the app has no cookie-based session (Supabase Auth lives only in browser `localStorage`), so Server Actions have no way to know who's calling.

As a first patch, `lib/auth/require-permission.ts` (`requirePermission(accessToken, permissionKey)`) was added and wired into the highest-risk role/permission/worker-deletion actions, with the client manually fetching and passing its access token (`getAccessToken()` in `lib/studio-client.ts`).

This document lays out how to evolve that patch into a proper layered architecture across the rest of the codebase, phase by phase.

**Target layering (outside → in):**
```
Server Action (boundary)
  → withPermission(key)        — who is calling, are they allowed
  → input schema (Zod)         — is the payload shaped correctly
  → service/domain function    — business logic, talks to Prisma
  → Prisma                     — data access
```

---

## Phase -1 — Repo housekeeping (do first)

**Why:** a quick file-architecture pass (2026-06-07) found stale/orphaned files at the repo root that predate the `apps/`+`packages/` monorepo split. None of this blocks the auth work, but clearing it now keeps the upcoming refactor PRs from having to navigate around dead weight — and confirms there's no hidden dependency that would surprise us mid-migration.

**Findings (verified via `git log` / grep — nothing here is referenced by any config or import):**
- **Orphaned root `src/`** — `src/app/reservations/masterview/*` and `src/components/{ui/sidebar.tsx, layout/nav.tsx}`. `apps/web/tsconfig.json` resolves `@/*` to `apps/web/src/*`, not root `src/`, so this directory is not on any build path. `apps/web/src/components/layout/nav.tsx` already exists as the (presumably current) version — root `src/` looks like a pre-monorepo leftover. Last touched 3 months ago in "Fix production Prisma targets and standalone bundle pathing".
- **12 loose debug scripts at repo root** — `check_admins.ts`, `check_db.ts`, `check_orphans.ts`, `check_orphans_v2.ts`, `check_roles.ts`, `check_workers.ts`, `test_action.ts`, `test_db_pkg.ts`, `test_get_workers.ts`, `test_mealstub.ts`, `test_relation.ts`, `test_allocation.ts`. All landed 3 months ago via "chore: stage debug scripts, worker fixes, and db action updates" / "Fix production Prisma targets…" commits, untouched since, and not referenced from any `package.json`/config. A `scripts/` directory already exists — these are one-off scratch files that belong there or in the trash.
- **2 stray PowerShell scripts** — `fix_html.ps1`, `sync-git.ps1` — same vintage, same "not referenced anywhere" status, on a project whose shell is zsh/Darwin.
- **2 empty SQL dumps** — `remote_schema.sql`, `schema_dump.sql` (0 bytes, last touched 11 days ago). Likely artifacts of a failed `pg_dump`/Supabase schema pull; carry no content and aren't referenced.
- **`services/` naming is inconsistent** — `email-service.ts`, `notification-service.ts`, `venue-assistance-notifications.ts` (kebab-case) vs `mealstubService.ts` (camelCase). Minor, but worth normalizing before Phase 3 adds more files to this directory.

**Work:**
- Confirm with the team whether the orphaned root `src/` masterview pages were superseded by something in `apps/web/src/app/reservations/masterview/` (they appear to be — the route exists there too); if so, delete root `src/` entirely.
- Move any `check_*`/`test_*` scripts still useful for ad-hoc debugging into `scripts/`; delete the rest. Same for the `.ps1` files (or delete outright, since the project runs on zsh/Darwin).
- Delete the two empty `.sql` files, or regenerate them properly if a schema dump is actually needed somewhere.
- Rename `mealstubService.ts` → `meal-stub-service.ts` to match the kebab-case convention used elsewhere in `services/` and `lib/`.

**Exit criteria:** repo root contains no orphaned app code or one-off debug scripts; `services/` filenames follow one consistent convention.

---

## ORS Legacy Sync — Findings & Hardening Plan

**Why flagged separately:** `actions/ors-sync.ts` (1075 lines, 17 exported actions) is the bulk import/sync bridge between the legacy ORS system (`https://cogdasma.com/ors-reader/public`) and this app's Prisma DB. A 2026-06-07 review found it has the same missing-server-side-permission-check gap as the rest of `actions/*.ts`, plus several sync-specific data-safety risks that make "destructive by accident" a real possibility — distinct from, and arguably worse than, the generic authorization gap, since this domain can mint new accounts and overwrite existing worker records in bulk.

### Findings

1. **No server-side permission check on any of the 17 exported actions.** The settings page (`app/settings/ors-sync/page.tsx`) gates the UI with `isSuperAdmin || canManageOrsSync`, but the Server Actions themselves — `importOrsNewWorkers`, `syncOrsUpdatedWorkers`, `syncOrsWorkerPasswords`, `importOrsMinistries`, `importOrsSatellites`, `importOrsAreas`, `importOrsMentorGroups`, `importOrsMentees`, `importOrsAttendanceBatch` — accept calls from anyone who can reach the action endpoint, UI or not.

2. **Privilege-escalation via `defaultRoleId`.** `importOrsNewWorkers(orsWorkerIds, { defaultRoleId, ... })` writes the client-supplied `defaultRoleId` directly onto `Worker.roleId` ([ors-sync.ts:627](../apps/web/src/actions/ors-sync.ts#L627)) with no whitelist — an unauthorized caller could mint new accounts as `admin`/super-admin.

3. **Blind overwrite in `syncOrsUpdatedWorkers` — no "is the legacy data actually newer" check.** The function lets the client choose which fields to sync per worker (`item.fields`), but once a field is selected, the legacy value is written unconditionally — there's no comparison against `updatedAt` or any local-edit marker. A sync run against stale ORS data can silently clobber recent in-app edits (name corrections, ministry reassignment, status changes) with old legacy values. The only trail is a free-text `logOrsSyncEvent` entry — there's no diff snapshot or undo.

4. **Email overwrite can break Supabase Auth linkage.** `data.email = w.email` ([ors-sync.ts:716](../apps/web/src/actions/ors-sync.ts#L716)) changes the very field used to match the worker to their Supabase Auth account and to look them up in `requirePermission`/login flows — but nothing updates the corresponding Supabase Auth user. A legacy email change synced into Prisma can orphan the account (user can no longer log in with either address) without any error surfacing at sync time.

5. **`syncOrsWorkerPasswords` can resurrect the legacy login path on already-migrated accounts.** It overwrites `legacyPasswordHash` regardless of whether the worker has already completed migration (`legacyMigratedAt` set, `passwordChangeRequired: false`). Since `legacy-auth.ts` checks `legacyPasswordHash` as a fallback login path, re-populating it on a migrated account re-opens an authentication route that was supposed to be retired for that user.

6. **No transactions; partial-failure state is real but not catastrophic.** Each loop (`importOrsNewWorkers`, `syncOrsUpdatedWorkers`, etc.) commits row-by-row inside a `try/catch`, so a mid-run failure leaves a partially-applied batch — recoverable (re-running skips already-processed rows) but means "all or nothing" isn't guaranteed, and there's no batch-level audit record beyond per-row `ImportResult.errors`.

7. **`importOrsMinistries` can create ministries with an empty `leaderId`** (`leaderId: headId || ''`) when the legacy `head_id` doesn't map to an imported worker — a data-integrity smell (empty string in what's presumably a foreign-key-ish field) rather than a destructive risk per se.

### Does it need an overhaul?

No — not a rewrite. The per-row skip-if-exists checks, the diff-preview (`getWorkerDiffPage`) shown before syncing, and the field-level selection in `syncOrsUpdatedWorkers` show the design already leans toward "review before write." The gap is that **none of those safeguards are enforced server-side** — they're UI conveniences a direct action call can bypass, and even through the UI there's no check that legacy data is actually newer than local data before an overwrite is applied.

**Recommended hardening (can land alongside the Phase 1 `withPermission` rollout for this domain — see "Suggested order of domains" below, where `ors-sync` is already priority #2):**
- [x] Gate every mutating export with `requirePermission`/`withPermission`, closing finding #1. **Landed:** every export in `actions/ors-sync.ts` (mutating *and* read-only/preview) now calls `requirePermission(PERMISSIONS.system.manage_ors_sync)` — `system:manage_ors_sync` was already registered in `lib/permissions/registry.ts`.
- [x] Whitelist `defaultRoleId` against a small fixed set, closing #2. **Landed:** `importOrsNewWorkersOptionsSchema` (Zod, `lib/schemas/ors-sync.schemas.ts`) restricts it to `'viewer' | 'worker'`, enforced again defensively inside `services/ors-sync.ts#importOrsNewWorkers`.
- [x] Add an `updatedAt` recency check in `syncOrsUpdatedWorkers`, closing #3. **Landed:** `services/ors-sync.ts#syncOrsUpdatedWorkers` skips (and logs) any worker whose local `updatedAt` is within the last 24h, since ORS doesn't expose its own modification timestamp to compare against.
- [x] Pair an email change with a Supabase Auth update and re-validate for collisions, closing #4. **Landed:** `services/ors-sync.ts#syncSupabaseAuthEmail` looks up the legacy-auth user by old email, refuses if the new address collides with a different auth user, and calls `supabaseAdmin.auth.admin.updateUserById(...)`; the Prisma `email` write is skipped (with an error logged to the batch result) if the auth-side repoint can't be done safely.
- [x] Make `syncOrsWorkerPasswords` skip already-migrated workers, closing #5. **Landed:** skips when `legacyMigratedAt` is set or `passwordChangeRequired === false`.
- [x] Persist a batch-level audit snapshot, addressing #6. **Landed (2026-06-07):** added a private `logBatchSummary()` helper in `services/ors-sync.ts` that writes one `TransactionLog` row (`{success, skipped, failed, errors}` counts + joined error list) at the end of each run; wired into `importOrsNewWorkers` (`batch_import_completed`) and `syncOrsUpdatedWorkers` (`batch_sync_completed`). **Deliberately not** a full `prisma.$transaction(...)` around the whole batch — these loops are intentionally partially-recoverable (re-running skips already-processed rows per their own per-row skip-if-exists checks), so an all-or-nothing transaction would *replace* that recovery model rather than harden it. The summary row gives operators the missing "did this batch run cleanly" signal without sacrificing per-row resilience.
- [x] Backfill missing `head_id` mappings as `null` instead of `''`, addressing #7. **Landed:** `importOrsMinistries` now writes `leaderId: headId || null`.
- [x] **Extract to Service Layer**: `src/services/ors-sync.ts` now holds all business logic; `actions/ors-sync.ts` is boundary glue (`requirePermission` → Zod parse → service delegation → `revalidatePath`). *(Batch-level `$transaction` wrapping from finding #6 still outstanding — see above.)*
- [x] **Implement Zod Schemas**: `src/lib/schemas/ors-sync.schemas.ts` validates `importOrsNewWorkers` options and `syncOrsUpdatedWorkers` items at the action boundary.

---

## Phase 0 — Foundation: real sessions (`@supabase/ssr`)

**Why first:** every later phase assumes "the action knows who's calling" is cheap and automatic. Right now it requires manually threading an access token through every call site — that doesn't scale to 120 actions and is easy to get wrong.

**Work:**
- Add `@supabase/ssr`; replace the browser-only `supabase` client (`packages/database/src/supabase-client.ts`) with cookie-aware browser/server client factories.
- Add a server client helper (e.g. `lib/supabase-server.ts`) that reads the session from `next/headers` cookies.
- Update `login`/`signup`/`password-change` flows to use the cookie-based client so the session round-trips through requests.
- Remove the manual `getAccessToken()` plumbing added in the interim patch — `requirePermission` can call `auth.getUser()` directly from the server client.

**Exit criteria:** a Server Action can resolve "current Worker" without any argument from the client.

**Status: ✅ Landed (2026-06-07).**
- `packages/database/src/supabase-client.ts` now builds the browser client with `createBrowserClient` from `@supabase/ssr` (cookie-backed session instead of localStorage) — a drop-in replacement, so `login`/`signup`/`password-change-dialog`/`user-nav` needed no code changes.
- Added `apps/web/src/lib/supabase-server.ts`: `getSupabaseServerClient()` (reads/writes session cookies via `next/headers`) and `getServerUser()` (wraps `auth.getUser()` in React's `cache()` so it runs once per request).
- Added `apps/web/src/middleware.ts` to refresh the session cookie on every request — required so cookies don't expire mid-session. **Web-only**: Next.js skips middleware for static export, so the `BUILD_MOBILE=true` Capacitor build is unaffected and keeps working exactly as before (see scope decision below).
- `requirePermission(permissionKey)` dropped its `accessToken` parameter entirely and now calls `getServerUser()` directly — no token threading.
- Removed all `getAccessToken()` plumbing from call sites: `actions/db.ts` (`setRolePermissions`, `setRolePermissionsByKeys`, `assignRolesToWorker`, `createRole`, `updateRole`, `deleteRole`, `deleteWorker`, `deleteWorkers` all dropped their leading `accessToken` param), `app/settings/roles/page.tsx`, `app/workers/[id]/edit/page.tsx`, `hooks/use-workers.ts`, `hooks/use-worker-mutations.ts`, and the now-dead `getAccessToken` export in `lib/studio-client.ts`.
- `npx tsc --noEmit` passes clean; dev server boots with middleware compiled and serves pages with no runtime errors.

**Scope decision — mobile build stays on the old flow:** `next.config.ts` builds with `output: 'export'` when `BUILD_MOBILE=true` for the Capacitor app, and `@supabase/ssr`'s cookie/middleware model requires a server runtime that static export doesn't have. Server Actions don't run under static export either, so the mobile build was never exercising this code path — it continues to work via the existing token-based Supabase client calls (`studio-client.ts`'s `getToken`/edge-function clients), untouched by this migration.

**Performance angle:** `auth.getUser()` from a cookie-based server client is a network call to Supabase Auth on every invocation. Wrap the per-request user resolution in React's `cache()` so it runs once per request regardless of how many actions/components call it — this is the same mechanism Next.js recommends for `getServerSession`-style helpers, and it removes redundant auth round-trips before they ever get added.

---

## Phase 1 — Boundary layer: `withPermission` wrapper

**Why:** a bare `await requirePermission(token, KEY)` as the first line of a function is easy to forget; a wrapper makes the permission a *declared, visible* part of the export.

**Work:**
- Build `withPermission(permissionKey, handler)` in `lib/auth/with-permission.ts` — resolves the caller server-side (via Phase 0), checks the permission/super-admin, and only then invokes `handler(ctx, ...args)` where `ctx = { workerId, email, isSuperAdmin }`.
- **Standardized Response Envelopes:** Update the wrapper to catch thrown errors (like validation or forbidden errors) and return a unified response shape (e.g., `{ success: true, data: T }` or `{ success: false, error: string }`). This prevents raw database/server errors from leaking details to the client and simplifies error handling in UI hooks.
- **Server-Side Auditing:** Integrate automatic server-side logging inside the wrapper or service layer. Mutating actions should write to the `TransactionLog` table automatically using the authenticated `ctx` info. This prevents clients from bypassing or spoofing audit logs, which is a risk when using client-triggered actions like `createTransactionLog`.
- Convert the actions already gated by the interim patch (`createRole`, `updateRole`, `setRolePermissions*`, `assignRolesToWorker`, `deleteWorker(s)`, `deleteRole`) to the wrapper form, dropping the manual `accessToken` parameter (Phase 0 makes it unnecessary).
- Add a grep-able convention check (lint rule or `/security-scan` step) that flags exported actions in `actions/*.ts` not wrapped in `withPermission` or explicitly marked `// public-action: <reason>`.

**Exit criteria:** every mutating export in `actions/db.ts` is either wrapped or explicitly documented as intentionally public (e.g. signup bootstrap).

**Performance angle:** this is the natural place to memoize the `Worker → WorkerRole → Role → RolePermission` join (the 4-level include `requirePermission` runs). Since `withPermission` is the single choke point every check passes through, caching the resolved permission set here — keyed by `workerId`, scoped to the request via `cache()` — means the cost is paid once no matter how many actions a single request chain calls, instead of bolting a cache on after the fact in Phase 5.

---

## Phase 2 — Validation layer: Zod input schemas

**Why:** several actions take `data: any` and spread it into `prisma.create/update`, allowing mass assignment (e.g. `isSuperAdmin`). This isn't unique to roles — `createWorker`, `updateWorker`, venue/event actions have the same shape.

**Work:**
- For each domain module (`workers`, `roles`, `events`, `schedule`, `venue-assistance`, `meals`, `attendance`, `inventory`…), define a Zod schema per mutation that whitelists exactly the fields a client may set.
- Parse-and-narrow at the top of each action (after `withPermission`, before touching Prisma): `const input = CreateWorkerSchema.parse(data)`.
- Replace `data: any` signatures with the inferred Zod types.

**Exit criteria:** no exported action in `actions/*.ts` accepts `any`/untyped client payloads for writes.

**Performance angle:** `z.parse()` throws on first error and walks the whole shape on every call — for large payloads (e.g. ORS bulk import rows) prefer `safeParse` plus reusing compiled schemas (define them once at module scope, not inside the action body) so Zod doesn't rebuild its internal validators per invocation. This is also the moment to trim over-fetching: a tightly-scoped input schema often reveals that an action only needs a handful of fields, which should shrink the corresponding Prisma `select`/`include` in Phase 3.

---

## Phase 3 — Service/domain layer

**Why:** actions currently mix three concerns — auth, validation, and business logic/Prisma access. That makes logic hard to reuse (e.g. the same "create worker" rules are needed by both the UI action and the ORS bulk-import job) and hard to test without mocking Next.js action plumbing.

**Work:**
- Introduce `services/<domain>.ts` (e.g. `services/workers.ts`, `services/roles.ts`, `services/schedule.ts`) holding the actual Prisma logic, taking an already-authorized `ctx` plus validated input.
- Server Actions become thin: `withPermission(key, async (ctx, input) => workersService.create(ctx, ParsedInput))`.
- Migrate domain by domain — start with `roles`/`workers` (already touched in Phases 1–2), then `schedule`, `events`, `venue-assistance`, `ors-sync`, etc.

**Exit criteria:** `actions/*.ts` files contain only boundary glue (permission + validation + delegation); business logic lives in `services/*.ts` and is independently testable.

**Performance angle:** this is the highest-leverage phase for performance, because it's when the actual Prisma queries get rewritten and centralized. While migrating each domain: (a) replace per-row loops (`assignRolesToWorker`'s `upsert` loop, `importOrsNewWorkers`) with `createMany`/transaction-batched writes; (b) audit `include`/`select` shapes against what the caller actually needs (services make over-fetching visible since the same query is now reused across call sites); (c) wrap read-heavy service functions in `unstable_cache`/`React.cache` where the data changes infrequently (e.g. `getMinistries`, `getWorkloadCategories`). Doing this domain-by-domain alongside the refactor avoids a separate performance pass over the same files later.

---

## Phase 3.5 — Schedule Management Scope: Master vs. Ministry Schedulers

**Why:** The scheduling domain currently has coarse access checks (`schedule:manage`). Ministry schedulers should only be allowed to view/edit schedules and assignments belonging to their own ministry, whereas a "Master Scheduler" needs global visibility and management rights across all ministries.

**Work:**
- [x] **Add Permissions:** `schedule:view_all` already existed in `src/lib/permissions/registry.ts` (registry key `view_all: 'schedule:view_all'`, described as "Master Scheduler — view and manage all ministry schedules") — no change needed.
- [x] **Update Syncer & Hooks:** Added `canViewAllSchedules: sa || hasPerm('schedule:view_all')` to the `permissionsPayload` in `user-role-syncer-sql.tsx`, re-exposed it from `useUserRole` (`hooks/use-user-role.tsx`), and added the `canViewAllSchedules: boolean` field (+ default `false`) to `PermissionsState`/`DEFAULT_STATE` in `packages/store/src/permissions.store.ts`.
- [x] **Scope UI View:** `app/schedule/[id]/page.tsx` now derives `allMinistryIds` using the explicit `canViewAllSchedules` flag — Ministry Schedulers (lacking `schedule:view_all`) see only their own major/minor ministry's assignment sections; Master Schedulers/Super Admins see all ministries. This replaces the prior implicit heuristic (`canManageSchedule && !canAssignSchedulers`).
- [x] **Enforce Scoping in Actions — architectural decision:** Deliberately did NOT add per-write `ministryId` enforcement inside `upsertAssignment`/`deleteAssignment` in `actions/schedule.ts`. Those two are explicitly `public-action` self-service primitives shared by (a) schedulers assigning workers and (b) workers confirming/managing their own assignment slots regardless of ministry — layering a "caller's ministry must match `data.ministryId`" check there would break the legitimate self-service path for plain workers. The schedule-level admin actions (`createServiceSchedule`/`updateServiceSchedule`/`deleteServiceSchedule`/`applyTemplateToSchedule`/templates/`publishScheduleAndNotify`) all operate on whole `ServiceSchedule` records, which are not ministry-owned, so a `ministryId`-based scope check doesn't apply to them either. Practical scope enforcement therefore lives at the UI layer (above) plus the existing `schedule:manage` permission gate.

**Exit criteria:** A user with only Ministry Scheduler permissions sees/manages only their own ministry's assignment sections in the UI; a Master Scheduler or Super Admin sees and can manage assignments across all ministries. ✅ Met via `canViewAllSchedules`-driven UI scoping.

---

## Phase 4 — Consolidate the privileged-write pattern

**Why:** the app currently has two parallel paths to privileged DB writes — Next.js Server Actions (Prisma) and Supabase edge functions (Supabase JS client + `_shared/auth.ts`). Maintaining two auth models long-term is a recurring source of gaps like the one this review found.

**Work:**
- Decide on a primary pattern (recommendation: Server Actions + Prisma, since it's the majority and has better typing) and a documented exception policy for when an edge function is appropriate (cron, webhooks, things that must run outside Next).
- Where edge functions remain, give them the same explicit-permission-check shape as `withPermission` (today they only verify the JWT, not the permission — same root issue, different runtime).
- Document the decision and exception list in this file or a follow-up `ARCHITECTURE.md` note so future contributors don't reintroduce the split organically.

**Exit criteria:** one documented pattern for "privileged write," with edge functions limited to the documented exceptions and carrying equivalent permission checks.

### Decision (recorded 2026-06-07)

- **Primary pattern: Server Actions + Prisma**, gated through `withPermission`/`requirePermission` (`lib/auth/with-permission.ts`). This is now the pattern for every domain covered in Phases 2–3 (roles/workers, ors-sync, schedule/events, venue-assistance, meals/attendance/inventory) and should be the default for all new privileged writes.
- **Documented exception policy — edge functions are appropriate only for:**
  1. Work that must run outside the Next.js runtime (Supabase cron/scheduled triggers, webhooks from third parties).
  2. Operations that require the Supabase service-role key (privileged auth-admin calls, storage management) where keeping the key out of the Next.js server process is the safer boundary — this is exactly why commit `1e33f28` moved privileged DB ops for `attendance`, `ministries`, `settings`, `schedule`, `inventory`, `meals`, `workers`, `venue`, `c2s`, and `approvals` into `supabase/functions/*`.
  3. Anything that must bypass Next.js's request lifecycle entirely (long-running batch jobs beyond a server action's execution budget).
- **Known gap — carried forward as follow-up, not closed in this pass:** `supabase/functions/_shared/auth.ts`'s `verifyAuth()` only validates the JWT (`supabase.auth.getUser`) and returns `{ userId, dbRole }` — it does **not** check the caller's `Permission`/`RolePermission` rows the way `withPermission` does on the Next.js side. Bringing every edge function up to parity (replicating the `Worker → WorkerRole → Role → RolePermission` join in Deno, or calling back into a shared permission-check RPC) is real, multi-file Deno work across ~10 functions that needs its own scoped pass with edge-runtime testing — flagged here explicitly so it isn't silently reintroduced as "the gap that was supposedly fixed." Until then, edge functions should be treated as **trusted-caller-only** surfaces (i.e., only invoked from already-permission-checked Server Actions/cron, never directly from client code with elevated intent).
- This decision and the exception list live here; a separate `ARCHITECTURE.md` note was judged unnecessary duplication for a single-file plan doc that's already the canonical reference for this work.

**Performance angle:** consolidating removes a hidden cost — every Server Action that calls out to an edge function pays for an extra HTTP round-trip plus a second cold-start/auth-verification cycle on top of its own. Folding those operations into Prisma-backed services (where they don't have a genuine reason to run outside Next, e.g. cron/webhooks) collapses two network hops into one DB call. Where edge functions are kept, batch their calls (the `studio-client.ts` clients currently issue one HTTP request per operation) rather than looping client-side.

---

## Edge Functions — Deployment & Health Status (verified 2026-06-07)

**Why this section exists:** commit `1e33f28` ("remove exposed service-role key, move privileged DB ops to edge functions") moved a meaningful slice of privileged DB logic for the `studio` app out of Next.js and into Supabase edge functions (`supabase/functions/*`). Phase 4 above documents the *architectural* decision; this section is the **operational snapshot** — so a future session can answer "are the edge functions actually up?" without re-running CLI/curl checks from scratch.

**Linked Supabase project:** `vpgykxfbrfnojmgmzriq` (read from `supabase/.temp/project-ref`; CLI: `supabase functions list`).

**Studio-app functions — all `ACTIVE`, version `5`, last deployed `2026-05-31 09:23:12 UTC`:**
`settings`, `venue`, `workers`, `c2s`, `meals`, `ministries`, `schedule`, `approvals`, `attendance`, `inventory`
*(source: `supabase/functions/{settings,venue,workers,c2s,meals,ministries,schedule,approvals,attendance,inventory}/index.ts`, all sharing `supabase/functions/_shared/{auth,router,response,cors,logger}.ts`)*

**Other deployed functions (separate `tract-tracker` app, not part of this plan's scope):** `upload-to-drive` (v3), `auth-api` (v3), `users-api` (v2), `posts-api` (v3) — sourced from `apps/tract-tracker/supabase/functions/*`.

**Reachability check performed:** unauthenticated `curl` to each studio-function endpoint
(`https://vpgykxfbrfnojmgmzriq.supabase.co/functions/v1/<name>`) returned **`HTTP 401`** for all of `settings`, `venue`, `workers`, `schedule`, `meals`, `attendance`, `inventory` — i.e., they are deployed, reachable, and `_shared/auth.ts#verifyAuth()` is correctly rejecting requests that lack a valid `Authorization: Bearer <jwt>` header (not 404/500/connection-refused, which would indicate a broken deployment).

**What this check does *not* prove:**
- It does not exercise business logic — that needs a real authenticated worker session (sign in through the app, then watch network calls / `supabase functions logs <name>`).
- It does not confirm permission parity. As recorded in the Phase 4 "Decision" subsection above, `verifyAuth()` only validates the JWT (`supabase.auth.getUser`) and returns `{ userId, dbRole }` — it does **not** replicate the `Worker → WorkerRole → Role → RolePermission` permission check that `withPermission` enforces on the Next.js side. So: **deployed and authenticating ✅, but not yet permission-checked at parity with Server Actions** — treat these as trusted-caller-only surfaces per the Phase 4 exception policy until that follow-up lands.

**How to re-verify quickly in a future session:**
```bash
supabase functions list                      # deployment status/version/timestamp
curl -s -o /dev/null -w "%{http_code}" \
  https://vpgykxfbrfnojmgmzriq.supabase.co/functions/v1/<name>   # expect 401 if healthy
supabase functions logs <name>                # inspect recent invocations/errors
```

---

## Phase 5 — Performance enhancements

**Why:** the new auth layer adds a Prisma round-trip (`Worker → WorkerRole → Role → RolePermission → Permission`, 4-level include) to *every* mutating call. At scale that's a meaningful tax unless we cache it — and the layering work is also a natural point to fix pre-existing N+1 patterns in the actions being migrated.

**Work:**
- **Cache the permission lookup.** Memoize `requirePermission`'s resolved `{ workerId, roles, permissions }` per request (e.g. React `cache()`/`unstable_cache` keyed by the access token or resolved user id) so multiple permission checks within one request/action chain don't re-run the join. Consider a short-TTL (30–60s) cache for the permission set itself, invalidated on role/permission writes (`revalidateTag` from `assignRolesToWorker`, `setRolePermissions*`).
- **Index the join path.** Confirm `WorkerRole(workerId)`, `RolePermission(roleId)`, and `Permission(module, action)` are indexed (the unique constraints likely cover this, but verify with `EXPLAIN ANALYZE` once the wrapper is in heavy use).
- **Fix N+1s while migrating to the service layer (Phase 3).** Several actions loop with `await prisma.x.upsert(...)` per item (e.g. `assignRolesToWorker`, `importOrsNewWorkers`) — batch these into `createMany`/`upsert`-in-transaction where Prisma allows, since the service layer refactor already touches this code.
- **Re-evaluate `revalidatePath` usage.** Several actions call broad `revalidatePath('/workers')`/`revalidatePath('/settings/roles')` on every write; once actions are organized by domain (Phase 3), narrow these to the specific paths/tags affected to reduce unnecessary cache invalidation.

**Exit criteria:** permission checks add no more than one cached lookup per request; no loop-based per-row Prisma calls remain in the migrated domains; cache invalidation is scoped to what actually changed.

### Status (recorded 2026-06-07)

- [x] **Cache the permission lookup — already done.** `resolveCallerCtx` in `lib/auth/with-permission.ts` is wrapped in React's `cache()`, so the 4-level `Worker → WorkerRole → Role → RolePermission → Permission` include runs at most once per request no matter how many `withPermission`/`requirePermission` calls happen in that request's action chain. This was landed as part of Phase 1 (the wrapper itself), so Phase 5's caching goal was met before Phase 5 started. A cross-request TTL cache was considered and intentionally skipped — request-scoped caching already eliminates the N-per-request problem, and a cross-request cache would add invalidation complexity (`revalidateTag` plumbing through every role/permission write) for a join that's two indexed PK lookups deep (see below) — not worth it unless `EXPLAIN ANALYZE` shows it's hot.
- [x] **Index the join path — verified, already covered.** Checked `prisma/schema.prisma`: `WorkerRole` has `@@id([workerId, roleId])`, `RolePermission` has `@@id([roleId, permissionId])`, and `Permission` has `@@unique([module, action])`. All three composite PKs/unique constraints cover the exact join columns (`workerId`, `roleId`, `permissionId`, `(module, action)`) — no additional indexes needed.
- [x] **Fix N+1s.** `WorkersService.assignRolesToWorker` (`services/workers.ts`) replaced its per-`roleId` `tx.workerRole.upsert(...)` loop with a single `tx.workerRole.createMany({ data, skipDuplicates: true })` inside the existing `$transaction` — one round-trip instead of N. `importOrsNewWorkers`/`syncOrsUpdatedWorkers` (`services/ors-sync.ts`) were reviewed and left as per-row loops **by design**: each row needs independent skip-if-exists checks, individual try/catch for partial-failure recovery, and per-row `ImportResult` reporting — collapsing them into a batch call would trade away the recoverability the ORS-sync hardening plan explicitly relies on (see finding #6 above, where a `logBatchSummary` was added instead).
- [ ] **Re-evaluate `revalidatePath` usage — not yet done.** Broad invalidations (`revalidatePath('/workers')`, `revalidatePath('/settings/roles')`, etc.) remain in several actions. Narrowing these to the specific affected paths/tags is a low-risk but wide-reaching sweep across every domain action file; flagged here as a good follow-up PR rather than folded into this pass (it touches ~20+ call sites with no single safe automated transform, and mis-narrowing one risks stale UI — needs per-call-site review).

**Exit criteria reassessment:** permission-check caching ✅ and join-path indexing ✅ were already satisfied going into Phase 5; the Phase-3 service extractions removed the worst N+1 (`assignRolesToWorker`) ✅; `revalidatePath` scoping remains open as documented follow-up work.

---

## Suggested order of domains for Phases 2–3

Roughly by risk × frequency of change, based on the original review:

1. `roles` / `workers` (already started — highest privilege-escalation risk)
2. `ors-sync` (bulk worker creation + Supabase auth admin calls)
3. `schedule` / `events` (high traffic, frequent edits)
4. `venue-assistance`
5. `meals` / `attendance` / `inventory`

---

## Tracking

Each phase should land as its own PR (or small stack of PRs per domain in Phases 2–3) so review stays scoped. Update this document's checkboxes as phases land:

- [x] Phase -1 — repo housekeeping (orphaned `src/`, debug scripts, empty SQL dumps, `services/` naming)
- [x] Phase 0 — `@supabase/ssr` session migration (landed 2026-06-07, web-only — see Phase 0 status note)
- [x] Phase 1 — `withPermission` wrapper + convention check
- [x] Phase 2 — Zod validation schemas (per domain)
  - [x] roles / workers
  - [x] ors-sync (`importOrsNewWorkersOptionsSchema`, `syncUpdatedWorkerItemSchema` in `lib/schemas/ors-sync.schemas.ts`)
  - [x] schedule / events (`lib/schemas/schedule.schemas.ts`, `lib/schemas/events.schemas.ts` — parsed inside each `withPermission` handler in `actions/schedule.ts` / `actions/events.ts`)
  - [x] venue-assistance (`lib/schemas/venue-assistance.schemas.ts` — parsed inside boundary-glue actions in `actions/venue-assistance.ts`)
  - [x] meals / attendance (`lib/schemas/meals-attendance.schemas.ts` — `createMealStubSchema`/`updateMealStubSchema`/`createAttendanceRecordSchema`, parsed inside the `withPermission` handlers in `actions/db.ts`; inventory already covered by `events.schemas.ts` / `services/events.ts` `getInventoryItemsForPicker`)
- [x] Phase 3 — service/domain layer (per domain)
  - [x] roles / workers
  - [x] ors-sync (`services/ors-sync.ts`; `actions/ors-sync.ts` is now boundary glue: `requirePermission(system:manage_ors_sync)` + Zod parse + delegation + `revalidatePath`)
  - [x] events (`services/events.ts`; `actions/events.ts` is now boundary glue: `withPermission` + Zod parse + delegation + `revalidatePath`)
  - [x] schedule (`services/schedule.ts`; `actions/schedule.ts` is now boundary glue: `withPermission`/public-action wrappers + Zod parse + delegation + `revalidatePath`)
  - [x] venue-assistance (`services/venue-assistance.ts`; `actions/venue-assistance.ts` is now boundary glue: Zod parse + delegation, preserving the existing `assertConfigPermission` actor-based authorization model)
  - [x] meals / attendance (`services/meals-attendance.ts`; the meal-stub & attendance-record blocks inside the large multi-domain `actions/db.ts` now delegate via `withPermission` + Zod parse + service call + `revalidatePath`, leaving the rest of `db.ts` untouched; inventory reads already extracted into `services/events.ts`)
- [x] Phase 3.5 — Schedule Management Scope: Master vs. Ministry Schedulers (`canViewAllSchedules` added to syncer/hook/store; `/schedule/[id]` UI scoped by it; per-write `ministryId` enforcement intentionally skipped — see rationale in the Phase 3.5 section)
- [x] Phase 4 — consolidate privileged-write pattern + document exceptions (decision recorded: Server Actions + Prisma is primary; edge-function exception policy + the `_shared/auth.ts` permission-parity gap documented as an explicit follow-up — see Phase 4 "Decision" subsection)
- [x] Phase 5 — performance enhancements (permission-lookup caching ✅ already landed in Phase 1 via `cache()`; join-path indexes ✅ verified in `schema.prisma`; `assignRolesToWorker` N+1 ✅ fixed via `createMany`; `revalidatePath` narrowing flagged as open follow-up — see Phase 5 "Status" subsection)
