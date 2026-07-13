---
name: studio-patterns
description: Coding patterns, conventions, and workflows extracted from the studio monorepo
version: 3.0.0
source: local-git-analysis
analyzed_commits: 200
---

# Studio Monorepo Patterns

Church/ministry operations platform (workers, scheduling, events, meals,
inventory, reservations, C2S) built as a **Next.js 15 + Firebase + Prisma**
monorepo. Flagship app: `apps/web` on **Firebase App Hosting**. Auth is
**Firebase Auth**. Postgres via Prisma is the source of truth; Firestore is a
dual-write soak. Cloud Functions live under `functions/`. Inventory is the
Studio `/inventory` module (Prisma) — the standalone `apps/inventory` app was
sunset.

---

## Monorepo Structure

```
studio/
├── apps/
│   └── web/                         # Next.js 15 App Router (main app)
│       └── src/
│           ├── app/                 # Pages (route segments)
│           ├── actions/             # Server Actions (domain files + db.ts)
│           ├── services/            # Business logic + Prisma
│           ├── hooks/               # React Query hooks (use-*.ts)
│           ├── components/          # Shared UI components
│           ├── lib/firebase-client.ts
│           ├── lib/firebase-auth-server.ts
│           ├── lib/auth/with-permission.ts
│           ├── lib/permissions/registry.ts
│           └── store/user-role-syncer-sql.tsx
├── functions/                       # Firebase Cloud Functions (HTTP + cron)
│   └── src/routes/<module>.ts
├── prisma/schema.prisma             # Postgres schema (SoT)
├── apphosting.yaml                  # App Hosting
├── firebase.json                    # Functions / Firestore / Storage / emulators
├── supabase/migrations/             # Optional SQL indexes/functions (historical)
└── packages/
    ├── database/                    # Prisma client export
    ├── store/                       # Zustand permissions store
    ├── types/
    ├── ui/
    ├── client/                      # GraphQL/Apollo (limited)
    └── graphql/
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

## Data Layer: preferred pattern for apps/web

### Server Actions + Services + Prisma (default for new work)

```ts
// actions/my-module.ts
"use server";
import { withPermission } from '@/lib/auth/with-permission';
import { PERMISSIONS } from '@/lib/permissions/registry';
import * as MyService from '@/services/my-module';

export const listItems = withPermission(PERMISSIONS.myModule.view, async (_ctx) => {
  return MyService.listItems();
});
```

```ts
// services/my-module.ts
import { prisma } from '@studio/database/prisma';

export async function listItems() {
  return prisma.myModel.findMany({ orderBy: { createdAt: 'desc' } });
}
```

Public/anonymous endpoints use `withPublicAction`. Self-service worker edits
may use `withPublicAction` plus internal `canManageWorker` checks.

### Cloud Functions HTTP API (non-Next / mobile / schedulers)

Prefer extending `functions/src/routes/<module>.ts` when the caller is outside
Next.js. Verify Firebase ID tokens (`Authorization: Bearer …`). Do **not** add
new Supabase Edge Functions for `apps/web`.

### Legacy Pattern — do not use for web

`@studio/client` → Supabase Edge Functions under `supabase/functions/` is
**legacy**. Prefer Prisma + Firebase patterns in `apps/web`.

---

## Auth (Firebase)

| Surface | Entry |
|---|---|
| Browser | `lib/firebase-client.ts` — `signInWithEmailAndPassword`, etc. |
| Emulator | `NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true` + `FIREBASE_AUTH_EMULATOR_HOST` |
| Server | `getServerUser()` in `lib/firebase-auth-server.ts` |
| Actions | `resolveCallerCtx()` / `withPermission` in `lib/auth/with-permission.ts` |
| Middleware | Cookie session; public prefixes in `middleware.ts` |
| Permissions UI | `user-role-syncer-sql.tsx` → Zustand `@studio/store` |

Worker is matched by **email** (case-insensitive) to the Firebase Auth user.

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
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: createWorker,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['worker-stats'] });
    },
  });

  return { data, isLoading, createMutation };
}
```

**Rules:**
- Always set `staleTime` (min `30_000`; static data `5 * 60_000`).
- Use `placeholderData: (prev) => prev` for paginated queries.
- Invalidate related keys after mutations.

---

## Large Table Performance (6000+ rows)

- Server-side pagination via `getPaginatedWorkers(page, limit, filters)`.
- Prefer SQL fn `fn_workers_search` when present; otherwise Prisma fallback.
- Stats = separate aggregate queries.
- Schedule search: `getEligibleWorkers({ ministryId, query })` — not client filter.

---

## RBAC / Permissions

1. **Role-based**: `module:action` in DB → Roles → `WorkerRole`
2. **Ministry-based**: `Ministry.headId` / `approverId` implicit authority

Both feed `UserRoleSyncerSQL` → Zustand.

### Adding a New Permission

1. `PERMISSIONS` + `ALL_PERMISSIONS` in `registry.ts`
2. Derived flag in `user-role-syncer-sql.tsx`
3. `PermissionsState` + defaults in `packages/store`
4. `useUserRole` selector
5. `seedPermissions()` / Role Management UI
6. Nav `permissionKey` + `withPermission` on actions

---

## Approval System

Use `respondToApproval` / approval-engine workflows — do not invent ad-hoc
status strings. Side-effects run in transactions. Scope lists with
`{ workerId, ministryIds, isSuperAdmin }`.

---

## Architecture Rules (Client vs Server)

| Responsibility | Client | Server |
|---|---|---|
| Logic & Math | Display | Grouping, scoring, sorting, dates |
| Search & Filter | Debounced input | Prisma/SQL + pagination |
| Joins | Pre-joined objects | Resolve before return |
| Mutations | React Query + optimistic UI | Auth, validation, DB writes |

---

## Database

- Schema: **`prisma/schema.prisma`** (repo root)
- Local apply: `npx prisma db push` then `npx prisma generate`
- Optional indexes/functions: `supabase/migrations/*.sql` applied to the same Postgres (not via Supabase Auth)
- App Hosting secrets: `DATABASE_URL`, `DIRECT_URL`

---

## Adding a New Module — Checklist

1. **Prisma model** — `prisma/schema.prisma` → `db push` / `generate`
2. **Service** — `apps/web/src/services/<name>.ts`
3. **Server actions** — `apps/web/src/actions/<name>.ts` with `withPermission` / `withPublicAction`
4. **React Query hook** — `apps/web/src/hooks/use-<name>.ts`
5. **Page** — `apps/web/src/app/<name>/page.tsx` inside `<AppLayout>` (or `app/public/` if anonymous)
6. **Permission keys** — registry → syncer → store → hook → nav
7. **Optional Cloud Function route** — `functions/src/routes/<name>.ts` if needed outside Next
8. **Approvals** — wire `approval-engine.ts` if the module needs workflows
9. **Firestore dual-write** — only if the domain already participates in soak/backfill scripts

---

## Deploy reminders

| Surface | Mechanism |
|---|---|
| Web | App Hosting on `main` (`apphosting:build`) |
| Functions / rules | `FIREBASE_TOKEN` CI or local `firebase deploy` |
| Cron | Cloud Functions → `APP_BASE_URL` + `/api/cron/*` |

Never put `buildCommand` in `apphosting.yaml` (strips npm workspaces).

---

## Key Dependencies

| Purpose | Package / service |
|---|---|
| UI | `@studio/ui` |
| Data fetching | `@tanstack/react-query` |
| State | `zustand` (`@studio/store`) |
| ORM | Prisma (`@studio/database`) |
| Auth | Firebase Auth |
| Hosting | Firebase App Hosting |
| Background API | Firebase Cloud Functions |
| Forms | react-hook-form + zod |
| Tables | `@tanstack/react-table` |
