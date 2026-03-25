# ORS Syncer — Development Prompt

## Overview

Build the **ORS Syncer** module — an enhanced version of the existing ORS sync system (`/settings/ors-sync`) that focuses specifically on **Worker synchronization** between the legacy ORS system (CodeIgniter 3 / MySQL `cogdasma_db`) and the new COG App (Next.js / Prisma / Supabase).

The key goal is to **keep the legacy login working** during the migration period: workers log in using their **Worker ID** (`worker.id` in the legacy DB — an integer) and their **password** (stored as an MD5 hash in the legacy `worker.password` column). The new system must support this legacy login flow alongside the modern Supabase Auth flow.

---

## Context & Existing Infrastructure

### Legacy System (Source of Truth for Import)

- **Framework**: CodeIgniter 3 (PHP)
- **Database**: MySQL 8.0 — `cogdasma_db`
- **API bridge**: A read-only REST API at `https://cogdasma.com/ors-reader/public` exposes legacy tables via paginated JSON endpoints (e.g., `/tables/worker?page=1&limit=50`)
- **Auth**: Workers log in with their numeric `worker.id` and an MD5-hashed password (`worker.password` — 32-char hex string)

### Legacy `worker` Table (MySQL)

```sql
CREATE TABLE `worker` (
  `id`                       int NOT NULL,               -- Worker ID (login identifier)
  `church_id`                int NOT NULL DEFAULT '72',
  `first_name`               varchar(45) NOT NULL,
  `last_name`                varchar(45) NOT NULL,
  `email`                    varchar(45) DEFAULT NULL,
  `username`                 varchar(45) DEFAULT NULL,
  `password`                 varchar(45) NOT NULL,        -- MD5 hash (32 hex chars)
  `mobile`                   varchar(45) DEFAULT NULL,
  `address`                  varchar(200) DEFAULT NULL,
  `area_id`                  tinyint(1) NOT NULL,
  `birthdate`                date DEFAULT NULL,
  `facebook_handle`          varchar(45) DEFAULT NULL,
  `ministry_id`              int DEFAULT '0',             -- Primary ministry FK
  `sec_ministry_id`          int DEFAULT '0',             -- Secondary ministry FK
  `type`                     varchar(45) NOT NULL DEFAULT 'User',     -- 'User' | 'Admin' | etc.
  `status`                   varchar(45) NOT NULL DEFAULT 'Inactive', -- Account status
  `start_month`              varchar(15) DEFAULT NULL,
  `start_year`               varchar(4) DEFAULT NULL,
  `sys_create_id`            int NOT NULL DEFAULT '0',
  `sys_create_date`          datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sys_update_id`            int NOT NULL DEFAULT '0',
  `sys_update_date`          datetime NOT NULL,
  `flag`                     varchar(45) DEFAULT NULL,
  `remarks`                  varchar(255) NOT NULL,
  `qrdata`                   varchar(20) NOT NULL,
  `worker_status`            varchar(10) NOT NULL DEFAULT 'Active',   -- Worker-level status
  `last_password_change_date` datetime DEFAULT NULL,
  `worker_type`              varchar(50) NOT NULL DEFAULT 'Volunteer', -- 'Volunteer' | 'Full-Time' | etc.
  `biometrics_id`            int DEFAULT NULL
);
```

### Legacy `ministry` Table (MySQL)

```sql
CREATE TABLE `ministry` (
  `id`            int NOT NULL,
  `name`          varchar(45) NOT NULL,
  `department_id` int NOT NULL,
  `head_id`       int DEFAULT NULL
);
```

### Legacy `department` Table (MySQL)

```sql
CREATE TABLE `department` (
  `id`      int NOT NULL,
  `name`    varchar(45) NOT NULL,
  `head_id` int DEFAULT NULL
);
```

### New System (Prisma / Supabase)

The new `Worker` model in Prisma:

```prisma
model Worker {
  id                     String    @id @default(uuid())   -- Supabase Auth UID
  workerId               String?                          -- Legacy worker.id (stored as string)
  workerNumber           Int?      @unique                -- Numeric login ID (legacy worker.id as int)
  firstName              String
  lastName               String
  email                  String    @unique
  phone                  String
  roleId                 String?
  status                 String                           -- 'Active' | 'Inactive'
  avatarUrl              String
  majorMinistryId        String                           -- Primary ministry UUID
  minorMinistryId        String                           -- Secondary ministry UUID
  employmentType         String?                          -- 'Volunteer' | 'Full-Time' | 'On-Call'
  birthDate              String?
  passwordChangeRequired Boolean   @default(false)
  qrToken                String?
  isSeniorPastor         Boolean   @default(false)
  address                String?
  biometricsId           Int?
  startMonth             String?
  startYear              String?
  remarks                String?
  createdAt              DateTime  @default(now())
  roles                  WorkerRole[]
  // ... other relations
}
```

### Current Login Flow

The new system currently uses **Supabase Auth** with email + password via `supabase.auth.signInWithPassword()`. The login page is at `/login` and accepts email/password only.

### Existing ORS Sync Code

- **Server actions**: `apps/web/src/actions/ors-sync.ts` — already has `getWorkerDiffPage()`, `importOrsNewWorkers()`, `syncOrsUpdatedWorkers()`, and helpers
- **UI page**: `apps/web/src/app/settings/ors-sync/page.tsx` — tabbed UI with worker diff table, ministry/area/branch import, gated by `isSuperAdmin`
- **API bridge**: All legacy data accessed via `https://cogdasma.com/ors-reader/public` REST API — no direct MySQL connection
- **Permission**: `system:manage_ors_sync` registered in `src/lib/permissions/registry.ts`

### Baseline Reality Check (Current vs Target)

Use this as a non-negotiable alignment checklist while implementing:

- Current sync supports `new` / `updated` / `synced` worker statuses only; add `orphan` and direction-aware sync views.
- Current login is email-only; add Worker ID login mode.
- Current import does **not** store legacy password hash; add persisted `legacyPasswordHash` support.
- Current Worker import writes `workerId` but not `workerNumber`; write both.
- Current sync updates selected profile fields but does not sync password hash; add password-only sync action.
- Current ORS Sync access is super-admin only; allow permission-based access (`system:manage_ors_sync`) while still allowing super-admin override.
- Current ORS sync actions do not write `TransactionLog`; add explicit audit logging for import/sync/auth events.

---

## Requirements

### 1. Legacy Login Support (Worker ID + MD5 Password)

**Goal**: Allow workers to log in using their legacy Worker ID (integer) and their existing MD5 password, so they don't need to do anything differently during migration.

#### How It Should Work

1. The login page gets a **toggle or tab** to switch between "Email Login" and "Worker ID Login"
2. In "Worker ID Login" mode:
   - Input field: **Worker ID** (numeric)
   - Input field: **Password** (plaintext, submitted securely over HTTPS)
3. On submit, a **server action** handles the legacy auth flow:
   - Look up the worker in Prisma by `workerNumber` (the legacy integer ID)
   - If found and the worker has a linked Supabase Auth account:
     - **MD5-hash** the submitted password server-side (`crypto.createHash('md5').update(password).digest('hex')`)
     - Compare the hash against the stored legacy password hash (see storage below)
     - If match → sign the worker into Supabase Auth programmatically (use `supabaseAdmin.auth.admin.generateLink()` or a custom JWT approach)
   - If the worker is not yet imported → show a clear error: "Worker not found. Please contact your administrator."
4. After successful legacy login, the session is a standard Supabase session — all downstream auth (RLS, middleware, role syncer) works identically

#### Password Hash Storage

- **Add a new column** to the Prisma `Worker` model: `legacyPasswordHash String?` — stores the MD5 hash from the legacy system
- During ORS import, copy the MD5 hash from the legacy `worker.password` into `legacyPasswordHash`
- The hash is **never sent to the client** — it's only used server-side for authentication
- Once a worker resets their password or logs in via email, the `legacyPasswordHash` can optionally be cleared (since they now have a proper Supabase Auth password)

#### Security Considerations

- MD5 is cryptographically weak — this is a **transitional bridge**, not a long-term auth strategy
- The legacy hash comparison happens **server-side only** (in a server action)
- Rate-limit login attempts to prevent brute-force attacks against MD5 hashes
- Log all legacy login attempts for audit purposes
- Flag workers who haven't migrated to Supabase Auth after a configurable grace period (e.g., 90 days)
- Eventually deprecate Worker ID login once all workers have migrated

---

### 2. Worker Sync — Orphan & Diff Detection

**Goal**: Provide a clear view of workers that are out of sync between Legacy ORS and the New System, in both directions.

#### Sync Directions

| Direction | Meaning | Example |
|---|---|---|
| **Legacy → New** (Import) | Worker exists in ORS but not in the new app | New worker added in legacy system |
| **New → Legacy** (Orphan) | Worker exists in new app but has no matching ORS record | Worker created directly in new system, or legacy record deleted |
| **Both exist, out of sync** | Worker exists in both but fields differ | Name change in legacy not reflected in new system |

#### Fields to Compare & Sync

| Field | Legacy Column | New Prisma Field | Notes |
|---|---|---|---|
| Worker ID | `worker.id` (int) | `Worker.workerNumber` (int) / `Worker.workerId` (string) | Primary matching key |
| First Name | `worker.first_name` | `Worker.firstName` | |
| Last Name | `worker.last_name` | `Worker.lastName` | |
| Email | `worker.email` | `Worker.email` | Also used as secondary match key |
| Phone/Mobile | `worker.mobile` | `Worker.phone` | |
| Ministry | `worker.ministry_id` → `ministry.name` | `Worker.majorMinistryId` → `Ministry.name` | Matched by ministry name mapping |
| Secondary Ministry | `worker.sec_ministry_id` | `Worker.minorMinistryId` | Same name-based mapping |
| Password | `worker.password` (MD5) | `Worker.legacyPasswordHash` | **Hidden in UI** — show only a flag: `Has Password` / `No Password` / `Synced` / `Changed` |
| Status | `worker.status` + `worker.worker_status` | `Worker.status` | Map: `Active` → `Active`, else → `Inactive` |
| Employment Type | `worker.worker_type` | `Worker.employmentType` | Map: `Full-Time`, `Part-Time`→`On-Call`, else→`Volunteer` |
| Address | `worker.address` | `Worker.address` | |
| Birthdate | `worker.birthdate` | `Worker.birthDate` | |
| Start Month/Year | `worker.start_month`, `worker.start_year` | `Worker.startMonth`, `Worker.startYear` | |
| Biometrics ID | `worker.biometrics_id` | `Worker.biometricsId` | |
| QR Data | `worker.qrdata` | `Worker.qrToken` | |
| Remarks | `worker.remarks` | `Worker.remarks` | |

#### Password Flag Logic (UI Display)

The password column in the diff table should **never show the actual hash**. Instead, show a status badge:

| Badge | Meaning |
|---|---|
| 🟢 `Synced` | `legacyPasswordHash` matches the current ORS password hash |
| 🔵 `Has Password` | ORS has a password hash but it hasn't been imported yet |
| 🟡 `Changed` | ORS password hash differs from `legacyPasswordHash` (worker changed password in legacy) |
| ⚪ `No Password` | ORS `password` field is empty or null |
| 🔴 `Not Set` | Worker exists in new system but has no `legacyPasswordHash` |

#### Diff Table UI

Build a paginated, searchable table with these columns:

| Column | Description |
|---|---|
| **Status** | Badge: `New` (green) / `Updated` (amber) / `Synced` (gray) / `Orphan` (red) |
| **Direction** | Arrow icon: `← Legacy` / `→ New` / `↔ Both` |
| **Worker ID** | Legacy integer ID |
| **Name** | `First Last` — highlight if different between systems |
| **Email** | Highlight if different |
| **Ministry** | Ministry name — highlight if different |
| **Password** | Flag badge (see above) — never show hash |
| **Diff** | Expandable row showing field-level diffs (old → new) |
| **Actions** | Checkbox for batch sync, or individual "Sync" button |

#### Filters

- **Status filter**: `All` / `New` / `Updated` / `Synced` / `Orphans`
- **Direction filter**: `All` / `Legacy → New` / `New → Legacy`
- **Ministry filter**: Dropdown of ministries
- **Search**: By name, Worker ID, or email
- **Password filter**: `All` / `Has Password` / `No Password` / `Changed`

---

### 3. Sync Actions (Legacy → New)

#### Import New Workers

For workers that exist in Legacy but not in New:

1. Select one or more workers from the diff table
2. Click "Import Selected" or "Import All New"
3. For each worker:
   - Create a **Supabase Auth account** with the worker's email and a temp random password
   - Create a **Prisma Worker record** with all mapped fields
   - Store the **MD5 password hash** in `legacyPasswordHash` for legacy login support
   - Set `workerNumber` to the legacy `worker.id` (integer)
   - Set `workerId` to the legacy `worker.id` (string)
   - Set `passwordChangeRequired = true`
   - Map `ministry_id` → new Ministry UUID using the existing name-based ministry map
4. Show import results: success count, skipped (no email), failed (with error messages)

#### Sync Updated Workers

For workers that exist in both systems but have field diffs:

1. Select workers to sync
2. Choose sync direction: **Legacy → New** (overwrite new with legacy values)
3. Optionally cherry-pick which fields to sync (checkboxes per diff field)
4. On confirm:
   - Update the Prisma Worker record with the selected legacy values
   - If password has changed in legacy, update `legacyPasswordHash`
   - Log the sync action in `TransactionLog`

#### Sync Password Only

A focused action for updating just the password hash:

1. Select workers whose password flag shows `Changed` or `Not Set`
2. Click "Sync Passwords"
3. Server action re-fetches the worker from ORS API to get the current password hash
4. Updates `legacyPasswordHash` in Prisma
5. **Never** touches the Supabase Auth password — that's the worker's modern password

---

### 4. Schema Changes Required

#### Prisma Schema Addition

Add to the `Worker` model:

```prisma
model Worker {
  // ... existing fields ...
  legacyPasswordHash String?    // MD5 hash from legacy ORS worker.password
}
```

Also ensure imports write both legacy identifiers:

- `workerId` (string form of legacy `worker.id`)
- `workerNumber` (numeric form of legacy `worker.id`)

Run migration:

```bash
npx prisma migrate dev --name add_legacy_password_hash
```

#### ORS Reader API

Ensure the `ors-reader` API at `https://cogdasma.com/ors-reader/public` exposes the `password` field in the `/tables/worker/:id` endpoint response. The existing code already handles this (it re-fetches individual workers server-side for the hash and strips it before sending to the client).

---

### 5. Login Page Changes

#### Updated Login Page (`/login`)

Add a tab or toggle for Worker ID login:

```
┌─────────────────────────────────────────┐
│              COG App Login              │
│                                         │
│   ┌─────────────┐ ┌──────────────────┐  │
│   │  Email Login │ │ Worker ID Login  │  │
│   └─────────────┘ └──────────────────┘  │
│                                         │
│   Worker ID:  ┌──────────────────────┐  │
│               │ 1042                 │  │
│               └──────────────────────┘  │
│   Password:   ┌──────────────────────┐  │
│               │ ••••••••             │  │
│               └──────────────────────┘  │
│                                         │
│           [ Sign In ]                   │
│                                         │
│   Forgot your password?                 │
└─────────────────────────────────────────┘
```

#### Worker ID Login Server Action

```typescript
// apps/web/src/actions/legacy-auth.ts
'use server';

import crypto from 'crypto';
import { prisma } from '@studio/database/prisma';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function legacyWorkerIdLogin(workerId: number, password: string) {
  // 1. Find worker by workerNumber
  const worker = await prisma.worker.findFirst({
    where: { workerNumber: workerId },
    select: { id: true, email: true, legacyPasswordHash: true, status: true },
  });

  if (!worker || !worker.legacyPasswordHash) {
    return { error: 'Invalid Worker ID or password.' };
  }

  if (worker.status !== 'Active') {
    return { error: 'Your account is inactive. Please contact your administrator.' };
  }

  // 2. MD5-hash the submitted password and compare
  const submittedHash = crypto.createHash('md5').update(password).digest('hex');
  if (submittedHash !== worker.legacyPasswordHash) {
    return { error: 'Invalid Worker ID or password.' };
  }

  // 3. Generate a magic link or sign-in token for Supabase Auth
  // Use admin API to generate a sign-in link
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: worker.email,
  });

  if (error || !data) {
    return { error: 'Authentication failed. Please try again.' };
  }

  // Return the token properties for client-side session verification
  return {
    success: true,
    email: worker.email,
    token_hash: data.properties.hashed_token,
  };
}
```

> **Note**: The exact Supabase sign-in mechanism may vary. Options include:
> - `generateLink({ type: 'magiclink' })` + `verifyOtp()` on the client
> - Setting the Supabase Auth password to the legacy password during import (less secure but simpler)
> - A custom JWT-based approach if Supabase supports custom token exchange
>
> Choose the approach that best fits your Supabase configuration. The critical requirement is that after legacy auth succeeds, the worker gets a valid Supabase session.

---

### 6. Audit & Logging

All sync and legacy auth operations must be logged in `TransactionLog`:

| Action | Module | Details |
|---|---|---|
| `legacy_login` | `auth` | `Worker #{id} logged in via Worker ID` |
| `legacy_login_failed` | `auth` | `Failed login attempt for Worker ID #{id}` |
| `worker_imported` | `ors-sync` | `Imported worker #{orsId} as #{newId}` |
| `worker_synced` | `ors-sync` | `Synced fields: {fieldList} for worker #{id}` |
| `password_synced` | `ors-sync` | `Legacy password hash synced for worker #{id}` |

---

### 7. File Structure

```
apps/web/src/
├── actions/
│   ├── ors-sync.ts              # Existing — enhance with password sync
│   └── legacy-auth.ts           # NEW — Worker ID login server action
├── app/
│   ├── login/
│   │   └── page.tsx             # MODIFY — add Worker ID login tab
│   └── settings/
│       └── ors-sync/
│           └── page.tsx         # MODIFY — enhance worker diff table
```

---

### 8. Implementation Order

1. **Schema migration** — Add `legacyPasswordHash` to Worker model, run Prisma migration
2. **ORS Sync enhancements** — Update `ors-sync.ts` to:
   - Import `legacyPasswordHash` during worker import
   - Add password diff detection (compare stored hash vs ORS current hash)
   - Add `syncPasswords()` action
   - Add orphan detection (New → Legacy direction)
3. **Sync UI updates** — Update `/settings/ors-sync` page:
   - Add password flag column to diff table
   - Add direction column and orphan detection
   - Add password-only sync action
   - Add filters for password status and sync direction
4. **Legacy auth server action** — Create `legacy-auth.ts` with Worker ID + MD5 auth
5. **Login page update** — Add Worker ID login tab to `/login`
6. **Audit logging** — Add TransactionLog entries for all sync and legacy auth operations
7. **Testing** — End-to-end test: import a worker from ORS, log in with Worker ID, verify session

---

### 9. Phase Plan (Recommended)

Implement in small, safe phases to avoid auth and sync regressions:

#### Phase 1 — Schema + Action Plumbing

- Add `legacyPasswordHash` to Prisma `Worker`.
- Update import to set `workerId`, `workerNumber`, and `legacyPasswordHash`.
- Add password sync status computation (`Synced`, `Changed`, `Not Set`, `No Password`, `Has Password`) server-side.
- Add `syncOrsWorkerPasswords()` server action.

#### Phase 2 — Diff/Orphan Coverage

- Extend worker diff API to support:
  - Direction filter (`Legacy -> New`, `New -> Legacy`, `Both`)
  - `orphan` status for workers existing only in new system
  - Search by Worker ID, name, and email (not first-name-only)
- Expand compared/syncable fields (email, address, startMonth, startYear, biometricsId, remarks, qrToken, ministries).

#### Phase 3 — UI and Permission Gates

- Add direction and password-status filters in `/settings/ors-sync` worker tab.
- Replace hash-type display with password sync-state badges.
- Add explicit "Sync Passwords" batch action.
- Gate page access by `isSuperAdmin || canManageOrsSync`.

#### Phase 4 — Legacy Login Bridge

- Add Worker ID login tab in `/login`.
- Implement `legacy-auth.ts` server action with server-only MD5 comparison.
- Bridge successful auth into a valid Supabase session.
- Add rate limiting and consistent generic error responses.

#### Phase 5 — Audit + Hardening

- Log all sync/auth events to `TransactionLog`.
- Add safe retry and partial-failure handling for batch operations.
- Add feature flag to disable Worker ID login when migration is complete.

---

### 10. Definition of Done (Acceptance Criteria)

The module is considered complete only if all items below pass:

1. Worker ID login works for an imported worker with valid MD5 legacy hash.
2. Invalid Worker ID/password attempts are rejected with generic errors and logged.
3. Worker import writes `workerId`, `workerNumber`, and `legacyPasswordHash`.
4. Worker diff table includes `orphan` status and direction filtering.
5. Password column shows sync-state badges, never raw hash values.
6. "Sync Passwords" updates only `legacyPasswordHash` and never Supabase password.
7. Worker sync can update required profile fields without breaking existing worker-role relations.
8. ORS sync access works for super admin and `system:manage_ors_sync` permission holders.
9. All import/sync/login operations create `TransactionLog` entries.
10. Existing ORS sync tabs (ministries/areas/c2s/attendance) continue to function unchanged.

---

### 11. Important Notes

- **MD5 is a transitional bridge** — not a permanent auth solution. Plan to deprecate Worker ID login after all workers have migrated to email-based Supabase Auth.
- **Password hashes stay server-side** — never expose MD5 hashes to the client. The UI only shows flag badges.
- **The ORS Reader API is read-only** — syncing is one-directional (Legacy → New). The new system does not write back to the legacy MySQL database.
- **Ministry mapping uses name matching** — the existing `getOrsMinistryMap()` function handles this. Ministry names must match between legacy and new system.
- **Workers without email** cannot be imported (Supabase Auth requires email). These should be flagged in the UI with a clear message.
- **Rate limiting** on the Worker ID login endpoint is critical since MD5 hashes are vulnerable to brute-force attacks.

### 12. Explicit Non-Goals (for this iteration)

- Writing updates back to legacy MySQL / CodeIgniter database.
- Replacing Supabase Auth as the primary auth system.
- Migrating every legacy module in ORS; this scope is worker sync + worker login continuity.
