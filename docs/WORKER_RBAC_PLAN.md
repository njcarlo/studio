# Worker Management & RBAC Update Plan

## Context

This document captures the planned updates to the Worker Management and RBAC systems of cogapp. The app is a rewrite of the legacy ORS (Online Reservation System) and C2S (Connect 2 Souls) systems. After reviewing the full v2 prompt (`docs/PROMPT.md`), we decided to selectively adopt the best architectural ideas without a full rewrite.

**Decisions made:**
- Keep the Department / Ministry org structure (not the full generic `org_nodes` tree) — but make it more flexible
- Workers can have **multiple roles** (`WorkerRole` join table)
- Auth for `apps/web` is **Firebase Auth** (email/password; session cookie + `resolveCallerCtx`)
- Permissions use **`module:action`** format

> Historical note: earlier drafts of this plan targeted Supabase Auth. That path
> was replaced by the Firebase cutover. Postgres via Prisma remains the worker
> data source of truth.

---

## 1. Schema Changes

### Worker — what changes

**Remove:**
- `roleId String` (single FK to Role) → replaced by `WorkerRole` join table

**Add:**
- `authUserId String? @unique` — optional link to Firebase Auth `uid` (many flows match Worker by **email** today)
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

## 2. Auth Migration: Firebase Auth

**Status: Done for `apps/web`.** Firebase Auth is the active authentication system.

### What's in place

- Login / signup use the Firebase web SDK (`signInWithEmailAndPassword`, etc.) via `lib/firebase-client.ts`
- Server identity via `getServerUser()` (`lib/firebase-auth-server.ts`) and cookie session middleware
- `user-role-syncer-sql.tsx` loads Worker by email from the Firebase user and derives Zustand permissions
- Cloud Functions verify `Authorization: Bearer <Firebase ID token>`

### Design note: Worker identity

Workers are primarily matched to Firebase users by **email** (case-insensitive)
in `resolveCallerCtx()`. Prefer keeping `Worker.email` aligned with the Firebase
Auth email. An optional `authUserId` / uid link may exist for admin tooling —
do not assume `Worker.id === Firebase uid` for all records (ORS-imported workers
often predate Auth accounts).

### Env / secrets

- Local: `NEXT_PUBLIC_FIREBASE_*` (+ emulator hosts when `NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true`)
- App Hosting Secret Manager: same `NEXT_PUBLIC_FIREBASE_*`, plus `DATABASE_URL` / `DIRECT_URL` / `CRON_SECRET`

### Cleanup remaining (not blocking)

- Remove stale Supabase client comments from shared packages if any remain
- Keep legacy Supabase usage (if any remains outside Studio) isolated from web patterns

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
4. **Auth hardening** — Firebase session and role flows (can run in parallel with step 3).
5. **Worker module updates** — Multi-role UI, renamed fields, new profile fields.
6. **Roles admin page** — Permission matrix using registry, `isSuperAdmin` / `isSystemRole` handling.
