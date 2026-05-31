# Design Document: Monorepo Architecture Overhaul

## Overview

This document describes the architectural transformation of the Studio monorepo from a monolithic server-actions architecture to a distributed Edge Functions + typed SDK architecture. All business logic is extracted from `apps/web` (`src/actions/db.ts` and related action files) and `apps/inventory` (`src/lib/inventory-api.ts`) into 10 independent Supabase Edge Functions. A unified `@studio/client` SDK package wraps all Edge Function HTTP calls with TypeScript types derived from shared Zod schemas. The apps become thin presentation layers. Migration is module-by-module.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Client Applications                        │
├─────────────────────┬──────────────────────┬─────────────────────┤
│  apps/web           │  apps/inventory       │  Future: Expo       │
│  (Next.js)          │  (Next.js)            │  (React Native)     │
│  Zustand stores     │                       │                     │
└──────────┬──────────┴──────────┬────────────┴──────────┬──────────┘
           │                     │                       │
           └─────────────────────┼───────────────────────┘
                                 │
                   ┌─────────────▼──────────────┐
                   │      @studio/client         │
                   │  WorkersClient              │
                   │  ScheduleClient             │
                   │  MinistriesClient           │
                   │  VenueClient                │
                   │  ApprovalsClient            │
                   │  MealsClient                │
                   │  AttendanceClient           │
                   │  InventoryClient            │
                   │  C2SClient                  │
                   │  SettingsClient             │
                   └─────────────┬──────────────┘
                                 │  HTTPS + JWT Bearer
           ┌──────────┬──────────┼──────────┬──────────┐
           │          │          │          │          │
     ┌─────▼──┐ ┌─────▼──┐ ┌────▼───┐ ┌────▼───┐ ┌────▼───┐
     │workers │ │schedule│ │ministr.│ │ venue  │ │approv. │
     └────┬───┘ └────┬───┘ └────┬───┘ └────┬───┘ └────┬───┘
          │          │          │          │          │
     ┌────▼──┐ ┌─────▼──┐ ┌────▼───┐ ┌────▼───┐ ┌────▼───┐
     │ meals │ │attend. │ │invent. │ │  c2s   │ │setting.│
     └────┬──┘ └────┬───┘ └────┬───┘ └────┬───┘ └────┬───┘
          └─────────┴──────────┼───────────┴──────────┘
                               │
                  ┌────────────▼────────────┐
                  │   Supabase PostgreSQL    │
                  │   (Shared Database)      │
                  └──────────────────────────┘
```

---

## Cross-Cutting Concerns

### Authentication

Every Edge Function verifies the caller's identity before running any handler. The function extracts the `Authorization: Bearer {token}` header and calls `supabase.auth.getUser(token)` — this performs remote verification against Supabase Auth, validating the JWT signature and expiry server-side.

**Important naming distinction:** The JWT `role` claim is the Supabase database role (`authenticated` or `service_role`), not the application-level role. Application roles (e.g., "worship leader") live in the `WorkerRole` table and are resolved per-request when authorization logic requires them. Handlers that check application permissions query `WorkerRole → Role → RolePermission`.

```typescript
// supabase/functions/_shared/auth.ts
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

export interface AuthContext {
  supabase: SupabaseClient
  userId: string    // user.id from the JWT
  dbRole: string    // user.role from the JWT ("authenticated")
}

export async function verifyAuth(req: Request): Promise<AuthContext | Response> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonError('Missing or malformed Authorization header', 401)
  }
  const token = authHeader.replace('Bearer ', '')
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return jsonError('Invalid or expired token', 401)
  return { supabase, userId: user.id, dbRole: user.role ?? 'authenticated' }
}
```

### CORS

All Edge Functions handle `OPTIONS` preflight requests without JWT verification.

```typescript
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
}

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }
  return null
}
```

### Router

Each Edge Function uses a shared router that matches HTTP method + path pattern to a handler.

**Critical rule:** Literal path segments must be registered before parameterized segments of the same depth. Without this, `POST /schedules/from-template` would be captured by `POST /schedules/:id` when iterating a flat map. The `RouteMap` is an ordered array, not an object, to guarantee evaluation order.

```typescript
// supabase/functions/_shared/router.ts
export type Handler = (
  req: Request,
  ctx: AuthContext,
  params: Record<string, string>
) => Promise<Response>

export type RouteMap = Array<{ method: string; pattern: string; handler: Handler }>

export function matchRoute(
  routes: RouteMap,
  method: string,
  pathname: string
): { handler: Handler; params: Record<string, string> } | null {
  for (const route of routes) {
    if (route.method !== method) continue
    const params = matchPattern(route.pattern, pathname)
    if (params !== null) return { handler: route.handler, params }
  }
  return null
}

function matchPattern(pattern: string, path: string): Record<string, string> | null {
  const pp = pattern.split('/').filter(Boolean)
  const ap = path.split('/').filter(Boolean)
  if (pp.length !== ap.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(':')) {
      params[pp[i].slice(1)] = decodeURIComponent(ap[i])
    } else if (pp[i] !== ap[i]) {
      return null
    }
  }
  return params
}
```

**Registration example:**
```typescript
const routes: RouteMap = [
  // Literal routes first
  { method: 'POST', pattern: '/schedules/from-template', handler: createFromTemplate },
  { method: 'POST', pattern: '/meal-stubs/allocate',     handler: allocateMealStubs },
  { method: 'POST', pattern: '/attendance/scan',         handler: scanQRCode },
  { method: 'GET',  pattern: '/attendance/stats',        handler: getAttendanceStats },
  // Parameterized routes after
  { method: 'GET',    pattern: '/schedules/:id', handler: getSchedule },
  { method: 'PUT',    pattern: '/schedules/:id', handler: updateSchedule },
  { method: 'DELETE', pattern: '/schedules/:id', handler: deleteSchedule },
]
```

### Structured Logging

`console.error()` in Supabase Edge Functions outputs plain text. To satisfy Req 17.2, all error logging goes through a shared helper that emits JSON:

```typescript
// supabase/functions/_shared/logger.ts
export function logError(module: string, method: string, route: string, error: unknown) {
  console.error(JSON.stringify({
    level: 'error',
    module,
    method,
    route,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
  }))
}
```

### JSON Responses

```typescript
// supabase/functions/_shared/response.ts
import { corsHeaders } from './cors.ts'

export function jsonOk(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export function jsonError(message: string, status: number, details?: unknown): Response {
  return new Response(JSON.stringify({ error: message, details }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
```

### Zod Schema Sharing (Deno ↔ Node)

Zod schemas must be shared between Edge Functions (Deno runtime) and `@studio/client` (Node/browser).

- **Source of truth:** `packages/client/src/{module}/schemas.ts` using npm `zod`
- **During development:** Each Edge Function imports a mirrored copy from `supabase/functions/_shared/schemas/{module}.ts`. A CI script (`scripts/check-schema-sync.ts`) diffs the two locations and fails the build if they diverge.
- **Long-term:** Publish `@studio/client` to npm and import via `https://esm.sh/@studio/client`.

---

## Edge Function Shell

All 10 Edge Functions follow this pattern:

```typescript
// supabase/functions/{module}/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'
import { matchRoute, RouteMap } from '../_shared/router.ts'
import { jsonError } from '../_shared/response.ts'
import { logError } from '../_shared/logger.ts'

const MODULE = '{module}'

const routes: RouteMap = [
  // literal routes first, parameterized after
]

serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const authCtx = await verifyAuth(req)
  if (authCtx instanceof Response) return authCtx

  const url = new URL(req.url)
  const pathname = url.pathname.replace(`/${MODULE}`, '') || '/'

  const match = matchRoute(routes, req.method, pathname)
  if (!match) return jsonError('Route not found', 404)

  try {
    return await match.handler(req, authCtx, match.params)
  } catch (err) {
    logError(MODULE, req.method, pathname, err)
    return jsonError('Internal server error', 500)
  }
})
```

---

## Module API Contracts

### Workers (`/workers`)

| Method | Path | Handler | Notes |
|--------|------|---------|-------|
| GET | `/workers` | listWorkers | `?status=active&ministryId=` |
| POST | `/workers` | createWorker | Required: `firstName`, `lastName`, `email` |
| GET | `/workers/lookup` | lookupWorker | **Before `:id`** — `?firebaseUid=` or `?email=` |
| GET | `/workers/:id` | getWorker | 404 if not found |
| PUT | `/workers/:id` | updateWorker | |
| DELETE | `/workers/:id` | deleteWorker | Soft delete; 409 if active future assignments |
| GET | `/workers/:id/roles` | getWorkerRoles | |
| POST | `/workers/:id/roles` | assignRole | 409 if duplicate |
| DELETE | `/workers/:id/roles/:roleId` | removeRole | |
| GET | `/workers/:id/permissions` | getWorkerPermissions | Derived from `WorkerRole → Role → RolePermission` |

**"Active assignment" definition (Req 6.5):** Active = `Schedule.date >= CURRENT_DATE`. Past assignments do not block deletion.

```sql
SELECT sa.id FROM "ScheduleAssignment" sa
JOIN "Schedule" s ON s.id = sa."scheduleId"
WHERE sa."workerId" = $1 AND s.date >= CURRENT_DATE
LIMIT 1
```

**Soft delete:** Sets `status = 'inactive'`; record is never removed.

---

### Schedule (`/schedule`)

| Method | Path | Handler | Notes |
|--------|------|---------|-------|
| GET | `/schedules` | listSchedules | `?startDate=&endDate=&ministryId=` |
| POST | `/schedules` | createSchedule | Required: `date`, `serviceType` |
| POST | `/schedules/from-template` | createFromTemplate | **Before `/schedules/:id`** |
| GET | `/schedules/:id` | getSchedule | |
| PUT | `/schedules/:id` | updateSchedule | |
| DELETE | `/schedules/:id` | deleteSchedule | |
| POST | `/schedules/:id/assignments` | assignWorker | 422 if worker lacks role or ministry membership |
| DELETE | `/schedules/:id/assignments/:assignmentId` | removeAssignment | |
| GET | `/templates` | listTemplates | `?ministryId=` |
| POST | `/templates` | createTemplate | |
| GET | `/templates/:id` | getTemplate | |
| PUT | `/templates/:id` | updateTemplate | |
| DELETE | `/templates/:id` | deleteTemplate | |
| GET | `/templates/:id/slots` | listTemplateSlots | |
| POST | `/templates/:id/slots` | createTemplateSlot | |
| PUT | `/templates/:id/slots/:slotId` | updateTemplateSlot | |
| DELETE | `/templates/:id/slots/:slotId` | deleteTemplateSlot | |
| GET | `/schedules/:id/worship-slots` | listWorshipSlots | |
| POST | `/schedules/:id/worship-slots` | createWorshipSlot | |
| PUT | `/schedules/:id/worship-slots/:slotId` | updateWorshipSlot | |
| DELETE | `/schedules/:id/worship-slots/:slotId` | deleteWorshipSlot | |

**Template copy (Req 7.4):** Copies all `TemplateSlot` rows into new `ScheduleSlot` rows. Worker assignments are NOT copied.

**Assignment validation (Req 7.5):** Returns 422 when the worker lacks the slot's required `roleId`, OR lacks active membership in `Schedule.ministryId` (when set).

---

### Ministries (`/ministries`)

| Method | Path | Handler |
|--------|------|---------|
| GET | `/ministries` | listMinistries |
| POST | `/ministries` | createMinistry |
| GET | `/ministries/:id` | getMinistry |
| PUT | `/ministries/:id` | updateMinistry |
| DELETE | `/ministries/:id` | deleteMinistry |
| GET | `/ministries/:id/workload-categories` | listWorkloadCategories |
| POST | `/ministries/:id/workload-categories` | createWorkloadCategory |
| PUT | `/ministries/:id/workload-categories/:categoryId` | updateWorkloadCategory |
| DELETE | `/ministries/:id/workload-categories/:categoryId` | deleteWorkloadCategory |
| GET | `/ministries/:id/managers` | listManagers |
| POST | `/ministries/:id/managers` | assignManager |
| DELETE | `/ministries/:id/managers/:workerId` | removeManager |

**Ministry fetch response (Req 8.4):** `GET /ministries/:id` includes `departmentCode` (from linked `Department`), `managers` (Worker profiles), and `activeMemberCount`.

**Deletion guard (Req 8.5):** 409 if any Worker has `status = 'active'` and `ministryId = id`.

---

### Venue (`/venue`)

| Method | Path | Handler | Notes |
|--------|------|---------|-------|
| GET | `/reservations` | listReservations | `?roomId=&startDate=&endDate=` |
| POST | `/reservations` | createReservation | 409 on time conflict |
| GET | `/reservations/:id` | getReservation | |
| PUT | `/reservations/:id` | updateReservation | Re-checks conflicts excluding self |
| DELETE | `/reservations/:id` | deleteReservation | |
| GET | `/assistance-requests` | listAssistanceRequests | `?status=` |
| POST | `/assistance-requests` | createAssistanceRequest | Starts as `pending` |
| GET | `/assistance-requests/:id` | getAssistanceRequest | |
| PUT | `/assistance-requests/:id` | updateAssistanceRequest | Transitions: `pending→assigned→completed` |
| GET | `/recurring-bookings` | listRecurringBookings | |
| POST | `/recurring-bookings` | createRecurringBooking | Required: `roomId`, `recurrenceRule`, `startTime`, `endTime` |
| GET | `/recurring-bookings/:id` | getRecurringBooking | |
| POST | `/recurring-bookings/:id/expand` | expandRecurringBooking | Body: `{ horizon?: number }` |

**Conflict detection (Req 9.4):** `A.startTime < B.endTime AND A.endTime > B.startTime` for the same `roomId`. Only non-cancelled reservations (`status != 'cancelled'`) are checked. Use parameterized queries — never string-interpolate datetime values.

**Recurring booking expansion (Req 9.5):**
- `recurrenceRule` format: RRULE strings (RFC 5545), e.g., `FREQ=WEEKLY;BYDAY=SU`
- Uses `https://esm.sh/rrule@2`
- Default horizon: 90 days; maximum enforced: 365 days (return 400 if exceeded)
- Response: `{ created: N, skipped: N, instances: [...] }` — skipped instances are those that would conflict

---

### Approvals (`/approvals`)

| Method | Path | Handler | Notes |
|--------|------|---------|-------|
| GET | `/approvals` | listApprovals | `?status=&requesterId=` |
| POST | `/approvals` | createApproval | Starts as `pending` |
| GET | `/approvals/:id` | getApproval | |
| POST | `/approvals/:id/approve` | approveRequest | 403 no authority; 409 not pending |
| POST | `/approvals/:id/reject` | rejectRequest | 403 no authority; 409 not pending |

**Approval authority (Req 10.4):** Worker has authority if any assigned role has `approve_requests` in `RolePermission`. Resolved via `userId → Worker.firebaseUid → WorkerRole → Role → RolePermission`.

---

### Meals (`/meals`)

| Method | Path | Handler | Notes |
|--------|------|---------|-------|
| GET | `/meal-stubs` | listMealStubs | `?workerId=&serviceDate=&redeemed=` |
| POST | `/meal-stubs` | createMealStub | |
| POST | `/meal-stubs/allocate` | allocateMealStubs | **Before `/meal-stubs/:id`** |
| GET | `/meal-stubs/:id` | getMealStub | |
| PUT | `/meal-stubs/:id` | updateMealStub | |
| DELETE | `/meal-stubs/:id` | deleteMealStub | |
| POST | `/meal-stubs/:id/redeem` | redeemMealStub | 409 if already redeemed |

**Allocation (Req 11.2):** `POST /meal-stubs/allocate` body: `{ workerIds: string[], serviceDate: string }`. Idempotent — skips workers who already have a stub for that date.

**Redemption (Req 11.3):** Sets `redeemed = true`, `redeemedAt = now()`, `redeemedByWorkerId` from body. Returns 409 if `redeemed` is already `true`.

---

### Attendance (`/attendance`)

| Method | Path | Handler | Notes |
|--------|------|---------|-------|
| GET | `/attendance` | listAttendance | `?workerId=&serviceDate=&ministryId=` |
| POST | `/attendance` | createAttendance | 409 on duplicate |
| POST | `/attendance/scan` | scanQRCode | **Before `/attendance/:id`** |
| GET | `/attendance/stats` | getAttendanceStats | **Before `/attendance/:id`** |
| GET | `/attendance/:id` | getAttendance | |

**QR code payload schema (Req 12.2):** The QR code encodes a signed JWT with claims `{ workerId: string, iat: number }` signed with `SUPABASE_JWT_SECRET`. The `scanQRCode` handler:
1. Verifies the QR JWT signature using `SUPABASE_JWT_SECRET`
2. Validates `Worker.status = 'active'` for the decoded `workerId`; returns 404 if inactive/missing
3. Inserts attendance for `(workerId, serviceDate)` — `serviceDate` defaults to today if not in the request body
4. Returns 409 if a record already exists for `(workerId, serviceDate)`

**Stats response shape (Req 12.5):**
```json
{
  "totalCount": 120,
  "byDate": [{ "date": "2025-01-05", "count": 40 }],
  "byMinistry": [{ "ministryId": "...", "ministryName": "...", "count": 40 }]
}
```

---

### Inventory (`/inventory`)

| Method | Path | Handler | Notes |
|--------|------|---------|-------|
| GET | `/items` | listItems | `?ministryId=&categoryId=` |
| POST | `/items` | createItem | |
| GET | `/items/:id` | getItem | |
| PUT | `/items/:id` | updateItem | |
| DELETE | `/items/:id` | deleteItem | |
| GET | `/categories` | listCategories | `?ministryId=` |
| POST | `/categories` | createCategory | |
| GET | `/categories/:id` | getCategory | |
| PUT | `/categories/:id` | updateCategory | |
| DELETE | `/categories/:id` | deleteCategory | |
| GET | `/stock-logs` | listStockLogs | `?itemId=&ministryId=&startDate=&endDate=` |
| POST | `/stock-adjustments` | recordStockAdjustment | Atomic via RPC; clamps on Stock Out |
| GET | `/borrowings` | listBorrowings | `?itemId=&status=` |
| POST | `/borrowings` | createBorrowing | |
| PUT | `/borrowings/:id/return` | processReturn | |

**Atomic stock adjustment (Req 13.2):** Standard `UPDATE SET quantity = quantity - delta` is not safe under concurrent load because two simultaneous reads see the same pre-update value. Use a Postgres RPC with `FOR UPDATE` row lock:

```sql
-- supabase/migrations/XXXX_atomic_stock_adjustment.sql
CREATE OR REPLACE FUNCTION adjust_item_stock(
  p_item_id     UUID,
  p_delta       INTEGER,    -- positive = add, negative = subtract
  p_adj_type    TEXT,       -- 'Stock In' | 'Stock Out' | 'Adjustment'
  p_ministry_id UUID,
  p_notes       TEXT
) RETURNS TABLE(new_quantity INTEGER, actual_delta INTEGER) AS $$
DECLARE
  v_old_qty INTEGER;
  v_new_qty INTEGER;
  v_actual  INTEGER;
BEGIN
  SELECT quantity INTO v_old_qty
  FROM "InventoryItem" WHERE id = p_item_id FOR UPDATE;

  v_new_qty := GREATEST(0, v_old_qty + p_delta);
  v_actual  := v_new_qty - v_old_qty;

  UPDATE "InventoryItem" SET quantity = v_new_qty WHERE id = p_item_id;

  INSERT INTO "StockLog"
    ("itemId", "adjustmentType", delta, "actualDelta", "ministryId", notes, "createdAt")
  VALUES
    (p_item_id, p_adj_type, p_delta, v_actual, p_ministry_id, p_notes, now());

  RETURN QUERY SELECT v_new_qty, v_actual;
END;
$$ LANGUAGE plpgsql;
```

The Edge Function calls `supabase.rpc('adjust_item_stock', { p_item_id, p_delta, p_adj_type, p_ministry_id, p_notes })`.

**Ministry scoping (Req 13.6):** When `ministryId` is provided in query params, all queries filter by it. When absent, the request requires `super_admin` permission; otherwise return 403.

---

### C2S (`/c2s`)

| Method | Path | Handler |
|--------|------|---------|
| GET | `/groups` | listGroups |
| POST | `/groups` | createGroup |
| GET | `/groups/:id` | getGroup |
| PUT | `/groups/:id` | updateGroup |
| DELETE | `/groups/:id` | deleteGroup |
| GET | `/groups/:id/members` | listMembers |
| POST | `/groups/:id/members` | addMember |
| DELETE | `/groups/:id/members/:workerId` | removeMember |

**Fetch response (Req 14.3):** `GET /groups/:id` includes `leader` (full Worker profile) and `memberCount` (integer count).

---

### Settings (`/settings`)

| Method | Path | Handler | Notes |
|--------|------|---------|-------|
| GET | `/roles` | listRoles | |
| POST | `/roles` | createRole | |
| GET | `/roles/:id` | getRole | |
| PUT | `/roles/:id` | updateRole | |
| DELETE | `/roles/:id` | deleteRole | 409 if any Worker has this role |
| GET | `/roles/:id/permissions` | getRolePermissions | |
| PUT | `/roles/:id/permissions` | setRolePermissions | Full replace |
| GET | `/rooms` | listRooms | |
| POST | `/rooms` | createRoom | |
| GET | `/rooms/:id` | getRoom | |
| PUT | `/rooms/:id` | updateRoom | |
| DELETE | `/rooms/:id` | deleteRoom | 409 if future reservations exist |
| GET | `/departments` | listDepartments | |
| POST | `/departments` | createDepartment | |
| GET | `/departments/:id` | getDepartment | |
| PUT | `/departments/:id` | updateDepartment | |
| DELETE | `/departments/:id` | deleteDepartment | |
| GET | `/venue-elements` | listVenueElements | |
| POST | `/venue-elements` | createVenueElement | |
| PUT | `/venue-elements/:id` | updateVenueElement | |
| DELETE | `/venue-elements/:id` | deleteVenueElement | |

**Role deletion guard (Req 18.4):** 409 if any `WorkerRole.roleId = id` exists.

**Room deletion guard (Req 18.5):** 409 if any `RoomReservation` has `roomId = id` AND `startTime >= CURRENT_TIMESTAMP`. Past reservations do not block deletion.

---

## @studio/client SDK

### Package Structure

```
packages/client/
├── src/
│   ├── index.ts                  # Re-exports all clients and types
│   ├── base-client.ts            # BaseClient + ClientError
│   ├── workers/
│   │   ├── schemas.ts            # Zod schemas (source of truth)
│   │   ├── types.ts              # TypeScript types derived from schemas
│   │   └── client.ts             # WorkersClient
│   ├── schedule/
│   ├── ministries/
│   ├── venue/
│   ├── approvals/
│   ├── meals/
│   ├── attendance/
│   ├── inventory/
│   ├── c2s/
│   └── settings/
├── package.json
└── tsconfig.json
```

### BaseClient

```typescript
// packages/client/src/base-client.ts
export class ClientError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'ClientError'
  }
}

export class BaseClient {
  constructor(
    private readonly baseUrl: string,
    private readonly getToken: () => Promise<string | null>
  ) {}

  protected async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = await this.getToken()
    if (!token) throw new ClientError(401, 'No authentication token available')

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    const data = await res.json()
    if (!res.ok) throw new ClientError(res.status, data.error ?? 'Request failed', data.details)
    return data as T
  }
}
```

### SDK Initialization (Platform-Agnostic)

Clients accept `baseUrl` and `getToken` as constructor arguments — no platform-specific code in the package itself:

```typescript
// Next.js
const workers = new WorkersClient(
  process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL!,  // https://<ref>.supabase.co/functions/v1
  async () => (await supabase.auth.getSession()).data.session?.access_token ?? null
)

// Expo / React Native
const workers = new WorkersClient(
  process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL!,
  async () => (await supabase.auth.getSession()).data.session?.access_token ?? null
)
```

### Type Export Pattern

```typescript
// packages/client/src/index.ts
export { WorkersClient } from './workers/client'
export type { Worker, CreateWorkerRequest, UpdateWorkerRequest } from './workers/types'
export { ScheduleClient } from './schedule/client'
export type { Schedule, ScheduleTemplate, ScheduleAssignment } from './schedule/types'
// ... all other modules
```

Consuming apps import only from `@studio/client` — never directly from `@studio/types` for data-layer types.

---

## Migration Strategy

### Incremental Page Switching (Req 15.1–15.4)

No feature flags needed. The switch is at the **hook level**. During migration, two hook versions coexist:

- **Old:** `useWorkers()` — calls server action in `db.ts`
- **New:** `useWorkersV2()` — calls `WorkersClient`

Pages are migrated one at a time. When all pages for a module use the `V2` hook, the old hook and server actions are deleted and `useWorkersV2` is renamed to `useWorkers`.

### Deployment Sequence

| Phase | Module | Risk |
|-------|--------|------|
| 0 | Shared utilities + `@studio/client` scaffold | None — no app changes |
| 1 | Settings | Low — configuration data only |
| 2 | Workers | Medium — foundational; other modules depend on it |
| 3 | Ministries | Low |
| 4 | Schedule | Medium — complex validation logic |
| 5 | Venue | Medium — conflict detection |
| 6 | Approvals | Low |
| 7 | Meals | Low |
| 8 | Attendance | Medium — QR scan path is live-critical |
| 9 | C2S | Low |
| 10 | Inventory + apps/inventory overhaul | Medium — atomic stock RPC required first |
| 11 | Final cleanup | Low — removal only |

### Per-Phase Verification Checklist

- [ ] Edge Function deploys without errors (`supabase functions deploy {module}`)
- [ ] Unauthenticated requests return 401
- [ ] `OPTIONS` preflight returns 200 without auth
- [ ] Client module builds without TypeScript errors
- [ ] All pages for the module load correctly via new client hooks
- [ ] No direct Prisma or Supabase client calls remain in migrated pages
- [ ] All existing routes still work at the same URLs

---

## Known Gaps and Resolutions

| # | Gap identified | Resolution |
|---|----------------|------------|
| G1 | Route ambiguity: literal vs parameterized same path depth | `RouteMap` is an ordered array; literals registered before parameterized routes |
| G2 | JWT `role` claim ≠ application role (naming collision in Req 2.4) | `dbRole` = database role from JWT; application roles resolved from `WorkerRole` table |
| G3 | Concurrent stock updates break clamp invariant | `adjust_item_stock` Postgres RPC with `FOR UPDATE` row lock |
| G4 | QR code payload schema never defined (Req 12.2) | Signed JWT `{ workerId, iat }` using `SUPABASE_JWT_SECRET`, verified server-side |
| G5 | Zod schemas can't be shared natively between Deno and Node | Mirror schemas in `_shared/schemas/`; CI script detects drift |
| G6 | "Active assignment" undefined — past assignments blocked deletion | Active = `Schedule.date >= CURRENT_DATE` |
| G7 | Recurring booking horizon unbounded — DoS vector | Default 90 days; max 365 days enforced; 400 if exceeded |
| G8 | No mechanism for incremental page switching | Hook naming convention (`useXxxV2`); no feature flags needed |
| G9 | `console.error()` emits plain text, not structured JSON | `logError()` helper in `_shared/logger.ts` |
| G10 | `process.env.NEXT_PUBLIC_*` not available in Expo | SDK accepts `baseUrl`/`getToken` as constructor args |
| G11 | Req 16.2 type sync in same commit is un-automatable | PR template checklist item |
| G12 | Room deletion guard not time-scoped | Only future reservations (`startTime >= now()`) block deletion |
