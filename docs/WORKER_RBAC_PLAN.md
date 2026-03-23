# Worker Management & RBAC Update Plan

## Context

This document captures the planned updates to the Worker Management and RBAC systems of cogapp. The app is a rewrite of the legacy ORS (Online Reservation System) and C2S (Connect 2 Souls) systems. After reviewing the full v2 prompt (`docs/PROMPT.md`), we decided to selectively adopt the best architectural ideas without a full rewrite.

**Decisions made:**
- Keep the Department / Ministry org structure (not the full generic `org_nodes` tree) — but make it more flexible
- Workers can have **multiple roles** (`WorkerRole` join table)
- Auth migrates from **Firebase → Supabase Auth**
- Permissions renamed to **`module:action`** format

---

## 1. Schema Changes

### Worker — what changes

**Remove:**
- `roleId String` (single FK to Role) → replaced by `WorkerRole` join table

**Add:**
- `authUserId String? @unique` — Supabase Auth `auth.users.id`
- `workerNumber Int? @unique` — numeric login ID (legacy `worker_id`)
- `isSeniorPastor Boolean @default(false)`
- `address String?`
- `biometricsId Int?`
- `startMonth String?`
- `startYear String?`
- `remarks String?`

**Rename for clarity:**
- `majorMinistryId` → `primaryMinistryId`
- `minorMinistryId` → `secondaryMinistryId`

---

### Role — what changes

**Add:**
- `isSuperAdmin Boolean @default(false)`
- `isSystemRole Boolean @default(false)`

**Remove:**
- `permissions String[]` → replaced by `RolePermission` join table

---

### New models

```prisma
model Permission {
  id          String           @id @default(uuid())
  module      String           // 'workers', 'venues', 'meals', etc.
  action      String           // 'view', 'create', 'approve', etc.
  description String?
  roles       RolePermission[]

  @@unique([module, action])
}

model RolePermission {
  roleId       String
  permissionId String
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
}

model WorkerRole {
  workerId   String
  roleId     String
  assignedBy String?
  assignedAt DateTime @default(now())
  worker     Worker   @relation(fields: [workerId], references: [id], onDelete: Cascade)
  role       Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([workerId, roleId])
}
```

---

### Ministry — what changes

The four hardcoded position fields on Ministry (`leaderId`, `headId`, `approverId`, `mealStubAssignerId`) are kept as-is (**Option A — minimal change**). They remain useful for approval routing and org display. The new RBAC handles permissions independently.

---

## 2. Auth Migration: Firebase → Supabase

### Files that touch Firebase today

| File | What it does |
|---|---|
| `packages/store/src/auth.store.ts` | Holds Firebase `User` object |
| `apps/web/src/lib/firebase-admin.ts` | Admin SDK for server-side auth |
| `apps/web/src/app/auth-sync.tsx` | Bridges Firebase auth → Zustand |
| `apps/web/src/actions/auth.ts` | Server auth actions (login, logout, reset) |
| `apps/web/src/store/user-role-syncer-sql.tsx` | Reads Firebase UID to load worker |
| `apps/web/src/app/login/page.tsx` | Firebase sign-in |
| `apps/web/src/app/signup/page.tsx` | Firebase createUserWithEmailAndPassword |

### Migration steps (in order)

1. Install `@supabase/supabase-js` and `@supabase/ssr` — set up browser + server clients in `src/lib/supabase/`
2. Replace `auth.store.ts` — swap Firebase `User` for Supabase `Session`
3. Replace `auth-sync.tsx` — use `supabase.auth.onAuthStateChange`
4. Replace `firebase-admin.ts` — use Supabase service role client for server-side
5. Rewrite `auth.ts` server actions — `signInWithPassword`, `signOut`, `resetPasswordForEmail`
6. Update login/signup pages
7. Update `user-role-syncer-sql.tsx` — use Supabase session UID to look up worker via `authUserId`
8. Worker number login: workers log in with their numeric `workerNumber` + password. Look up `workerNumber` in the `workers` table pre-login to resolve their Supabase Auth identity.

QR token and QR-based auth paths remain unchanged.

---

## 3. Permission Renaming

All permissions adopt strict `module:action` format. This registry lives in `src/lib/permissions/registry.ts` and is the single source of truth for the UI accordion, middleware checks, and DB seeding.

### Rename map

| Current (flat string) | New (`module:action`) | Notes |
|---|---|---|
| `manage_roles` | `roles:view`, `roles:create`, `roles:update`, `roles:delete`, `roles:assign` | Split into granular |
| `manage_workers` | `workers:view`, `workers:create`, `workers:update`, `workers:delete` | Split |
| `manage_ministries` | `ministries:manage` | Keep coarse for now |
| `manage_facilities` | `facilities:manage` | Keep coarse |
| `create_room_reservation` | `venues:create` | |
| `edit_room_reservation` | `venues:update` | |
| `delete_room_reservation` | `venues:delete` | |
| `approve_room_reservation` | `venues:approve` | |
| `view_schedule_masterview` | `venues:view_calendar` | |
| `manage_approvals` | `approvals:manage` | |
| `operate_scanner` | `attendance:scan` | Scanner covers both meals and attendance |
| `view_attendance_log` | `attendance:view` | |
| `view_meal_stubs` | `meals:view` | |
| `manage_all_mealstubs` | `meals:manage` | |
| `manage_c2s` | `mentorship:manage` | |
| `view_c2s_analytics` | `mentorship:view_reports` | |
| `view_reports` | `reports:view` | |
| `view_transaction_logs` | `system:view_audit_logs` | |
| `manage_ors_sync` | `system:manage_ors_sync` | |

### Permission registry structure

```typescript
// src/lib/permissions/registry.ts
export const PERMISSIONS = {
  roles: {
    view:   'roles:view',
    create: 'roles:create',
    update: 'roles:update',
    delete: 'roles:delete',
    assign: 'roles:assign',
  },
  workers: {
    view:   'workers:view',
    create: 'workers:create',
    update: 'workers:update',
    delete: 'workers:delete',
  },
  ministries: {
    manage: 'ministries:manage',
  },
  facilities: {
    manage: 'facilities:manage',
  },
  venues: {
    create:        'venues:create',
    update:        'venues:update',
    delete:        'venues:delete',
    approve:       'venues:approve',
    view_calendar: 'venues:view_calendar',
  },
  approvals: {
    manage: 'approvals:manage',
  },
  attendance: {
    view: 'attendance:view',
    scan: 'attendance:scan',
  },
  meals: {
    view:   'meals:view',
    manage: 'meals:manage',
  },
  mentorship: {
    manage:       'mentorship:manage',
    view_reports: 'mentorship:view_reports',
  },
  reports: {
    view: 'reports:view',
  },
  system: {
    view_audit_logs:  'system:view_audit_logs',
    manage_ors_sync:  'system:manage_ors_sync',
  },
} as const;
```

---

## 4. Code Impact

### What breaks and needs updating

| Area | Impact |
|---|---|
| `PermissionsStore` | All boolean flags re-derived from `workerRoles[]` + `rolePermissions[]` instead of single `roleId` |
| `UserRoleSyncer` | Core rewrite — reads multiple roles, aggregates permissions across all of them |
| `useUserRole` hook | No public API change — just the underlying store |
| All `canManageWorkers`-style checks | Stay as booleans in the store, zero component changes needed |
| `useWorkers` hook | Remove `roleId`, expose `roles[]` (array of role objects) |
| `/workers` page | Role assignment UI → multi-select instead of single dropdown |
| `/settings/roles` page | Permission editor uses new `module:action` keys from registry |
| `createWorker` / `updateWorker` actions | Handle `WorkerRole` insert/update instead of `roleId` |
| `getRoles` action | Include `permissions` via join (not `String[]`) |
| Seed data | Existing role permission arrays migrated to `Permission` + `RolePermission` rows |

---

## 5. Proposed Order of Work

1. **Schema migration** — New Prisma models + migration (Worker, Role, Permission, RolePermission, WorkerRole). No logic changes yet.
2. **Seed permissions** — Populate `Permission` table with all `module:action` strings; migrate existing role `permissions String[]` to `RolePermission` rows.
3. **RBAC rewrite** — `UserRoleSyncer` + `PermissionsStore` to aggregate permissions from multiple roles.
4. **Auth migration** — Firebase → Supabase (can run in parallel with step 3).
5. **Worker module updates** — Multi-role UI, renamed fields, new profile fields.
6. **Roles admin page** — Permission matrix using registry, `isSuperAdmin` / `isSystemRole` handling.
