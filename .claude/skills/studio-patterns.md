---
name: studio-patterns
description: Coding patterns, conventions, and workflows extracted from the studio monorepo
version: 2.0.0
source: local-git-analysis
analyzed_commits: 200
---

# Studio Monorepo Patterns

A church/ministry operations platform (worker management, scheduling, events, meals, inventory, reservations) built as a Next.js 15 + Supabase Edge Functions monorepo.

---

## Monorepo Structure

```
studio/
├── apps/
│   └── web/                    # Next.js 15 App Router (main app)
│       └── src/
│           ├── app/            # Pages (route segments)
│           ├── actions/db.ts   # Server Actions — Prisma calls
│           ├── actions/schedule.ts  # Schedule-specific server actions
│           ├── hooks/          # React Query hooks (use-*.ts)
│           ├── components/     # Shared UI components
│           ├── lib/permissions/registry.ts  # Permission key registry
│           └── store/user-role-syncer-sql.tsx  # Permission derivation
├── supabase/
│   ├── functions/              # Deno Edge Functions (REST API)
│   │   ├── _shared/            # cors, auth, router, response, logger
│   │   └── <module>/index.ts   # One function per domain module
│   └── migrations/             # SQL migration files (timestamped)
└── packages/
    ├── client/                 # @studio/client — typed SDK wrapping Edge Functions
    ├── database/               # Prisma client export
    ├── store/                  # Zustand store (permissions, impersonation)
    ├── types/                  # Shared TypeScript types
    └── ui/                     # Shared shadcn/ui component library
```

---

## Commit Conventions

```
feat:              New feature
fix:               Bug fix
perf:              Performance improvement
refactor:          Code restructure without behavior change
chore:             Maintenance
feat(schedule):    Module-scoped variant (preferred)
```

---

## Data Layer: Two Parallel Patterns

### Pattern A — Server Actions + Prisma (complex / paginated queries)

`apps/web/src/actions/db.ts` — `"use server"` file, direct Prisma.

```ts
"use server";
import { prisma } from '@studio/database/prisma';

export async function getPaginatedWorkers(page = 1, limit = 25, filters: {...}) {
  const [data, total] = await Promise.all([
    prisma.worker.findMany({ where, skip: (page-1)*limit, take: limit }),
    prisma.worker.count({ where }),
  ]);
  return { data, total, page, totalPages: Math.ceil(total / limit) };
}
```

### Pattern B — @studio/client SDK → Supabase Edge Functions (preferred for new modules)

Add client class in `packages/client/src/index.ts`:

```ts
export class MyModuleClient extends BaseClient {
  list  = (p?: Record<string, string>) => this.request('GET', `/my-module${p ? '?' + new URLSearchParams(p) : ''}`)
  create  = (b: any)                   => this.request('POST', '/my-module', b)
  update  = (id: string, b: any)       => this.request('PUT', `/my-module/${id}`, b)
  remove  = (id: string)               => this.request('DELETE', `/my-module/${id}`)
}
```

Edge Function (`supabase/functions/<module>/index.ts`):

```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors }  from '../_shared/cors.ts'
import { verifyAuth }  from '../_shared/auth.ts'
import { matchRoute, RouteMap } from '../_shared/router.ts'
import { jsonOk, jsonError }    from '../_shared/response.ts'
import { logError }             from '../_shared/logger.ts'

const MODULE = 'my-module'
const routes: RouteMap = [
  { method: 'GET',    pattern: '/my-module',     handler: list },
  { method: 'POST',   pattern: '/my-module',     handler: create },
  { method: 'GET',    pattern: '/my-module/:id', handler: getById },
  { method: 'PUT',    pattern: '/my-module/:id', handler: update },
  { method: 'DELETE', pattern: '/my-module/:id', handler: remove },
]

serve(async (req: Request) => {
  const cors = handleCors(req); if (cors) return cors
  const auth = await verifyAuth(req); if (auth instanceof Response) return auth
  const url = new URL(req.url)
  const pathname = url.pathname.replace(`/${MODULE}`, '') || '/'
  const match = matchRoute(routes, req.method, pathname)
  if (!match) return jsonError('Route not found', 404)
  try   { return await match.handler(req, auth, match.params, url) }
  catch (err) { logError(MODULE, req.method, pathname, err); return jsonError('Internal server error', 500) }
})
```

---

## React Query Hooks Pattern

```ts
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useWorkers(params: { page?: number; search?: string } = {}) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['workers', params],
    queryFn: () => getPaginatedWorkers(params.page, 25, params),
    staleTime: 60_000,               // always set — prevents refetch-on-focus
    placeholderData: (prev) => prev, // keeps previous data during pagination
  });

  const createMutation = useMutation({
    mutationFn: createWorker,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['worker-stats'] }); // invalidate related keys
    },
  });

  return { data, isLoading, createMutation };
}
```

**Rules:**
- Always set `staleTime`. Minimum `30_000`; roles/departments/static data: `5 * 60_000`.
- Always add `placeholderData: (prev) => prev` for paginated queries.
- Invalidate all related query keys after mutations.

---

## Large Table Performance (6000+ rows)

Workers table has 6000+ rows. **Never** fetch all rows client-side.

- Server-side pagination via `getPaginatedWorkers(page, limit, filters)`.
- DB-level sorting using raw SQL for numeric fields.
- Stats run separate aggregate queries — not derived from the data array.
- Worker IDs displayed as 6-digit zero-padded strings: `String(id).padStart(6, '0')`.
- **Schedule worker search**: use `getEligibleWorkers({ ministryId, query })` server action — NOT a client-side filter over a large array. Returns priority-scored results (3 = ministry match, 2 = dept match, 1 = global).

---

## RBAC / Permissions System

### Architecture

Two layers work together:
1. **Role-based**: `module:action` permission strings in DB → assigned to Roles → assigned to Workers via `WorkerRole`
2. **Ministry-based**: `Ministry.headId` and `Ministry.approverId` fields grant implicit authority

Both feed into `UserRoleSyncerSQL` (`apps/web/src/store/user-role-syncer-sql.tsx`) which derives boolean flags stored in Zustand.

### Permission Key Format

`module:action` — defined in `apps/web/src/lib/permissions/registry.ts`.

```ts
import { PERMISSIONS } from '@/lib/permissions/registry';
// e.g. PERMISSIONS.approvals.manage === 'approvals:manage'
```

### Using Permissions in Components

```ts
import { usePermissionsStore } from '@studio/store';
const { hasPermission } = usePermissionsStore();
// OR via hook:
import { useUserRole } from '@/hooks/use-user-role';
const { canManageApprovals, canApproveEvents, isSuperAdmin } = useUserRole();
```

### Adding a New Permission

1. Add to `PERMISSIONS` object and `ALL_PERMISSIONS` array in `registry.ts`
2. Add derived boolean flag in `user-role-syncer-sql.tsx` `permissionsPayload`
3. Add field to `PermissionsState` interface and defaults in `packages/store/src/permissions.store.ts`
4. Add to `useUserRole` hook's `useShallow` selector
5. Run `seedPermissions()` to upsert new keys into DB

### Current Approval Permissions

| Flag | Permission Key | Who Gets It |
|---|---|---|
| `canManageApprovals` | `approvals:manage` | Super admin, ministry heads/approvers |
| `canApproveAllRequests` | `approvals:approve_all` | Super admin only (explicit grant) |
| `canApproveRoomReservation` | `venues:approve` | Ministry heads/approvers |
| `canApproveEvents` | `events:approve` | Super admin + explicit grant |
| `canManageEvents` | `events:create/update/delete` | Explicit grant |

---

## Approval System

### Approval Types & State Machines

| Type | Flow |
|---|---|
| **New Worker** | `Pending` → `Approved`/`Rejected` → auto-activates `Worker.status = Active` |
| **Profile Update** | `Pending` → `Approved`/`Rejected` |
| **Room Booking** | `Pending` → `Pending Admin Approval` → `Approved`/`Rejected` → syncs `Booking.status` |
| **Ministry Change** | `Pending Outgoing Approval` → `Pending Incoming Approval` → `Approved` → updates worker ministries |
| **Event** | `Pending` → `Approved`/`Rejected` |

### Key Rules

- **Always use `respondToApproval(id, 'approve' | 'reject')`** — never call `updateApproval` with a raw status string for normal flows. The state machine lives server-side.
- Side-effects (activate worker, sync booking, update ministry) run inside a `prisma.$transaction` — they are atomic.
- `getApprovals(scope)` accepts `{ workerId, ministryIds, isSuperAdmin }` to scope results — ministry users only see their own requests.
- `useApprovals()` hook automatically passes scope from the permissions store.

### Hook Usage

```ts
// In approvals page — worker data is joined in the query, no separate useWorkers call needed
const { approvals } = useApprovals(); // auto-scoped
const { respond, isUpdating } = useApprovalMutations();

respond({ id: request.id, action: 'approve' }); // server decides next state
```

---

## Architecture Rules (Client vs Server)

| Responsibility | Client | Server |
|---|---|---|
| Logic & Math | Pure UI display | Grouping, scoring, sorting, date calculation |
| Search & Filter | Debounced input trigger | SQL/Prisma matching, pagination |
| Relational Joins | Receives pre-joined objects | Joins resolved before returning |
| Mutations | Fires React Query actions, optimistic UI | Validation, auth checks, DB writes |

---

## Database Indexes

Key performance indexes in `supabase/migrations/20260531000002_performance_indexes.sql`:

```sql
-- Worker lookup by ministry + status (schedule assignment, eligible worker search)
CREATE INDEX idx_worker_ministry_status ON "Worker" ("status", "majorMinistryId", "minorMinistryId");

-- Inventory item category filtering
CREATE INDEX idx_inventory_item_category ON "InventoryItem" ("categoryId", "status");

-- Venue booking overlap checks
CREATE INDEX idx_booking_time_room ON "Booking" ("roomId", "startDate", "endDate") WHERE "status" != 'Cancelled';
```

---

## Database Migrations

```
supabase/migrations/YYYYMMDDHHMMSS_description.sql
```

```bash
npx supabase db push
```

After Prisma schema changes: `npx prisma generate`

---

## Adding a New Module — Checklist

1. **Migration** — `supabase/migrations/YYYYMMDDHHMMSS_<name>.sql`
2. **Prisma model** — update `prisma/schema.prisma`, run `prisma generate`
3. **Edge Function** — `supabase/functions/<name>/index.ts` using `_shared/` helpers
4. **SDK Client** — add `<Name>Client` class to `packages/client/src/index.ts`
5. **Server Actions** (complex queries) — add to `apps/web/src/actions/db.ts`
6. **React Query Hook** — `apps/web/src/hooks/use-<name>.ts`
7. **Page** — `apps/web/src/app/<name>/page.tsx` inside `<AppLayout>`
8. **Permission keys** — add to `registry.ts` + `ALL_PERMISSIONS` + syncer + store + hook
9. **Nav entry** — add with permission gate
10. **If module has approvals** — add approval type to `resolveNextApprovalStatus` in `db.ts`

---

## Key Dependencies

| Purpose | Package |
|---|---|
| UI components | `@studio/ui` (shadcn/ui) |
| Data fetching | `@tanstack/react-query` |
| State | `zustand` (`@studio/store`) |
| ORM | Prisma (`@studio/database`) |
| Edge Functions | Supabase Deno runtime |
| Forms | react-hook-form + zod |
| Tables | `@tanstack/react-table` |
| CSV export | `papaparse` |
