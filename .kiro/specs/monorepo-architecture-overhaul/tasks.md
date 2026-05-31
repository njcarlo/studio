# Implementation Plan: Monorepo Architecture Overhaul

## Migration Status Tracker

| Module | Edge Function | @studio/client | apps/web migrated | Server Actions removed |
|--------|--------------|----------------|-------------------|----------------------|
| Settings | ⬜ | ⬜ | ⬜ | ⬜ |
| Workers | ⬜ | ⬜ | ⬜ | ⬜ |
| Ministries | ⬜ | ⬜ | ⬜ | ⬜ |
| Schedule | ⬜ | ⬜ | ⬜ | ⬜ |
| Venue | ⬜ | ⬜ | ⬜ | ⬜ |
| Approvals | ⬜ | ⬜ | ⬜ | ⬜ |
| Meals | ⬜ | ⬜ | ⬜ | ⬜ |
| Attendance | ⬜ | ⬜ | ⬜ | ⬜ |
| Inventory | ⬜ | ⬜ | ⬜ | ⬜ |
| C2S | ⬜ | ⬜ | ⬜ | ⬜ |

---

## Tasks

- [ ] 1. Phase 0 — Foundation
  - [ ] 1.1 Install and configure Supabase CLI
    - Run `brew install supabase/tap/supabase` or install via npm
    - Run `npx supabase login` to authenticate
    - Run `npx supabase link --project-ref vpgykxfbrfnojmgmzriq` to link the project
    - Verify with `npx supabase status`
    - _Requirements: 1.2_

  - [ ] 1.2 Create shared Edge Function utilities
    - Create `supabase/functions/_shared/cors.ts` — `corsHeaders` constant and `handleCors()` returning `Response | null`
    - Create `supabase/functions/_shared/auth.ts` — `verifyAuth()` returning `AuthContext | Response`; uses `supabase.auth.getUser(token)` (remote verification); exposes `userId` (from `user.id`) and `dbRole` (from `user.role`); note: `dbRole` is the Supabase database role (`authenticated`), NOT the application role — application roles are resolved by querying `WorkerRole → Role → RolePermission`
    - Create `supabase/functions/_shared/router.ts` — `RouteMap` as an **ordered array** (not an object), `matchRoute()`, `matchPattern()` with `decodeURIComponent` on path params; array order is what prevents literal routes from being shadowed by parameterized routes
    - Create `supabase/functions/_shared/response.ts` — `jsonOk()` and `jsonError()` helpers
    - Create `supabase/functions/_shared/logger.ts` — `logError(module, method, route, error)` emitting `JSON.stringify({ level, module, method, route, message, stack, timestamp })` via `console.error`
    - _Requirements: 1.3, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 2.4, 2.5, 17.1, 17.2_

  - [ ] 1.3 Scaffold @studio/client package
    - Create `packages/client/package.json` with name `@studio/client`, `zod` dependency
    - Create `packages/client/tsconfig.json` extending root tsconfig
    - Create `packages/client/src/base-client.ts` — `BaseClient` class accepting `(baseUrl: string, getToken: () => Promise<string | null>)` and `ClientError` class carrying `status`, `message`, `details`; `getToken` pattern makes the SDK platform-agnostic (works in both `NEXT_PUBLIC_*` and `EXPO_PUBLIC_*` environments)
    - Create `packages/client/src/index.ts` — empty barrel until modules are added
    - Add `@studio/client` to `turbo.json` pipeline
    - Add `@studio/client: "*"` to `apps/web/package.json` and `apps/inventory/package.json`
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ] 1.4 Set up Supabase Edge Function secrets
    - Run `npx supabase secrets set SUPABASE_URL=<value>`
    - Run `npx supabase secrets set SUPABASE_ANON_KEY=<value>`
    - Run `npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<value>`
    - Run `npx supabase secrets set SUPABASE_JWT_SECRET=<value>` — required for QR code JWT verification in the attendance module
    - Document required secrets in `supabase/functions/.env.example`
    - _Requirements: 2.1, 12.2_

  - [ ] 1.5 Create schema sync CI check
    - Create `supabase/functions/_shared/schemas/` directory
    - Create `scripts/check-schema-sync.ts` that diffs each `packages/client/src/{module}/schemas.ts` against its mirror `supabase/functions/_shared/schemas/{module}.ts`; exits non-zero if any file is missing or content differs
    - Add `check-schema-sync` script to `turbo.json` pipeline so it runs in CI on every PR
    - This enforces Req 16.4 (shared Zod schemas) across the Deno/Node runtime boundary without publishing the package
    - _Requirements: 16.1, 16.4_

  - [ ] 1.6 Create atomic stock adjustment Postgres function
    - Create `supabase/migrations/XXXX_atomic_stock_adjustment.sql` containing `adjust_item_stock(p_item_id UUID, p_delta INTEGER, p_adj_type TEXT, p_ministry_id UUID, p_notes TEXT)` using `SELECT ... FOR UPDATE`, `GREATEST(0, ...)` clamp, and inserts a `StockLog` row; returns `(new_quantity INTEGER, actual_delta INTEGER)`
    - Apply migration: `npx supabase db push`
    - This migration must be applied before the inventory Edge Function is deployed in Phase 10
    - _Requirements: 13.2, 13.5_

- [ ] 2. Phase 1 — Settings Module
  - [ ] 2.1 Create settings Edge Function
    - Create `supabase/functions/settings/index.ts` using the shared shell from design.md
    - Register all routes as ordered `RouteMap` array
    - Implement: `listRoles`, `getRole`, `createRole`, `updateRole`, `deleteRole` — deletion 409 if any row in `WorkerRole` has this `roleId` (no date scope for role assignments)
    - Implement: `getRolePermissions`, `setRolePermissions` (full replace — delete all then insert)
    - Implement: `listRooms`, `getRoom`, `createRoom`, `updateRoom`, `deleteRoom` — deletion 409 if any `RoomReservation` has `roomId = id` AND `startTime >= CURRENT_TIMESTAMP`; past reservations do NOT block deletion
    - Implement: `listDepartments`, `getDepartment`, `createDepartment`, `updateDepartment`, `deleteDepartment`
    - Implement: `listVenueElements`, `createVenueElement`, `updateVenueElement`, `deleteVenueElement`
    - Deploy: `npx supabase functions deploy settings`
    - _Requirements: 1.1–1.7, 2.1–2.5, 18.1–18.5_

  - [ ] 2.2 Add SettingsClient to @studio/client
    - Create `packages/client/src/settings/schemas.ts` — Zod schemas for Role, Room, Department, VenueElement, RolePermission request/response types
    - Create `packages/client/src/settings/types.ts` — TypeScript types via `z.infer<>`
    - Create `packages/client/src/settings/client.ts` — `SettingsClient extends BaseClient`
    - Mirror schemas to `supabase/functions/_shared/schemas/settings.ts`
    - Export `SettingsClient` and all types from `packages/client/src/index.ts`
    - _Requirements: 3.2, 3.8, 16.1, 16.3, 16.4_

  - [ ] 2.3 Migrate apps/web settings pages to SettingsClient
    - Create `useRolesV2`, `useRoomsV2`, `useDepartmentsV2`, `useVenueElementsV2` hooks calling `SettingsClient`
    - Switch `/settings/roles`, `/settings/rooms`, `/settings/departments`, `/settings/venue-elements` pages to V2 hooks one at a time
    - Verify all pages render correctly after each switch
    - _Requirements: 4.1, 4.2, 4.5, 4.7, 15.1, 15.2_

  - [ ] 2.4 Remove settings server actions and rename V2 hooks
    - Delete roles, rooms, departments, venue elements functions from `apps/web/src/actions/db.ts`
    - Rename `useRolesV2 → useRoles`, etc.
    - Update migration status tracker: Settings ✅
    - _Requirements: 4.1, 15.4_

- [ ] 3. Phase 2 — Workers Module
  - [ ] 3.1 Create workers Edge Function
    - Create `supabase/functions/workers/index.ts`
    - **Register `GET /workers/lookup` before `GET /workers/:id`** in the RouteMap
    - Implement: `listWorkers`, `createWorker` (required: `firstName`, `lastName`, `email`), `lookupWorker` (`?firebaseUid=` or `?email=`; 404 if no match), `getWorker`, `updateWorker`
    - Implement: `deleteWorker` — soft delete (`status = 'inactive'`); before deletion, check for future assignments via `SELECT FROM ScheduleAssignment JOIN Schedule WHERE workerId = $1 AND Schedule.date >= CURRENT_DATE LIMIT 1`; return 409 if found
    - Implement: `getWorkerRoles`, `assignRole` (409 on duplicate), `removeRole`, `getWorkerPermissions` (flattened deduplicated set from all roles)
    - Deploy: `npx supabase functions deploy workers`
    - _Requirements: 1.1–1.7, 2.1–2.5, 6.1–6.5_

  - [ ] 3.2 Add WorkersClient to @studio/client
    - Create `packages/client/src/workers/schemas.ts`, `types.ts`, `client.ts`
    - Mirror schemas to `supabase/functions/_shared/schemas/workers.ts`
    - Export from `packages/client/src/index.ts`
    - _Requirements: 3.2, 3.8, 16.1, 16.3, 16.4_

  - [ ] 3.3 Migrate apps/web workers pages to WorkersClient
    - Create `useWorkersV2`, `useWorkerMutationsV2`, `useWorkerLogsV2` hooks
    - Switch `/workers`, `/workers/[id]`, `/workers/my-qr` pages to V2 hooks
    - _Requirements: 4.1, 4.2, 4.5, 4.7, 15.1, 15.2_

  - [ ] 3.4 Remove workers server actions and rename V2 hooks
    - Delete `getWorkers`, `getPaginatedWorkers`, `getWorkerStats`, `getWorkerById`, `getWorkerByEmail`, `createWorker`, `updateWorker`, `deleteWorker`, `deleteWorkers`, `getWorkerRoles`, `assignRolesToWorker`, `updateWorkersMinistries` from `db.ts`
    - Rename V2 hooks to canonical names
    - Update migration status tracker: Workers ✅
    - _Requirements: 4.1, 15.4_

- [ ] 4. Phase 3 — Ministries Module
  - [ ] 4.1 Create ministries Edge Function
    - Create `supabase/functions/ministries/index.ts`
    - Implement: `listMinistries`, `createMinistry`, `getMinistry` — response includes `departmentCode` (from linked Department), `managers` (Worker profiles from MinistryManager), `activeMemberCount` (count of Workers where `status = 'active'` and `ministryId = id`), `updateMinistry`
    - Implement: `deleteMinistry` — 409 if any Worker has `status = 'active'` AND `ministryId = id`
    - Implement: workload category CRUD (`listWorkloadCategories`, `createWorkloadCategory`, `updateWorkloadCategory`, `deleteWorkloadCategory`) and manager CRUD (`listManagers`, `assignManager`, `removeManager`)
    - Deploy: `npx supabase functions deploy ministries`
    - _Requirements: 1.1–1.7, 2.1–2.5, 8.1–8.5_

  - [ ] 4.2 Add MinistriesClient to @studio/client
    - Create schemas, types, client for ministries module
    - Mirror schemas to `supabase/functions/_shared/schemas/ministries.ts`
    - Export from index
    - _Requirements: 3.2, 3.8, 16.1, 16.3, 16.4_

  - [ ] 4.3 Migrate apps/web ministries pages to MinistriesClient
    - Switch `/ministries`, `/settings/ministries` pages to V2 hooks
    - _Requirements: 4.1, 4.2, 4.5, 4.7, 15.1, 15.2_

  - [ ] 4.4 Remove ministries server actions and rename V2 hooks
    - Delete ministry functions from `db.ts`
    - Delete workload category actions from `apps/web/src/actions/ministry-categories.ts`
    - Rename V2 hooks
    - Update migration status tracker: Ministries ✅
    - _Requirements: 4.1, 15.4_

- [ ] 5. Phase 4 — Schedule Module
  - [ ] 5.1 Create schedule Edge Function
    - Create `supabase/functions/schedule/index.ts`
    - **Register `POST /schedules/from-template` before `POST /schedules/:id`** in the RouteMap
    - Implement: `listSchedules`, `createSchedule` (required: `date`, `serviceType`), `createFromTemplate` (copies all TemplateSlots into new ScheduleSlots; does NOT copy worker assignments), `getSchedule`, `updateSchedule`, `deleteSchedule`
    - Implement: `assignWorker` — 422 if worker lacks slot's required `roleId` OR lacks ministry membership when `Schedule.ministryId` is set; `removeAssignment`
    - Implement: template CRUD (`listTemplates`, `createTemplate`, `getTemplate`, `updateTemplate`, `deleteTemplate`), template slot CRUD, worship slot CRUD
    - Deploy: `npx supabase functions deploy schedule`
    - _Requirements: 1.1–1.7, 2.1–2.5, 7.1–7.5_

  - [ ] 5.2 Add ScheduleClient to @studio/client
    - Create schemas, types, client for schedule module
    - Mirror schemas to `supabase/functions/_shared/schemas/schedule.ts`
    - Export from index
    - _Requirements: 3.2, 3.8, 16.1, 16.3, 16.4_

  - [ ] 5.3 Migrate apps/web schedule pages to ScheduleClient
    - Switch `/schedule`, `/schedule/[id]`, `/schedule/templates`, `/schedule/schedulers` pages to V2 hooks
    - _Requirements: 4.1, 4.2, 4.5, 4.7, 15.1, 15.2_

  - [ ] 5.4 Remove schedule server actions and rename V2 hooks
    - Delete all functions from `apps/web/src/actions/schedule.ts`
    - Rename V2 hooks
    - Update migration status tracker: Schedule ✅
    - _Requirements: 4.1, 15.4_

- [ ] 6. Phase 5 — Venue Module
  - [ ] 6.1 Create venue Edge Function
    - Create `supabase/functions/venue/index.ts`
    - Implement: `listReservations`, `createReservation` — conflict check: `A.startTime < B.endTime AND A.endTime > B.startTime` for same `roomId`; exclude `status = 'cancelled'` reservations; use parameterized Supabase query (no string interpolation of datetime values)
    - Implement: `getReservation`, `updateReservation` (re-checks conflict excluding self by id), `deleteReservation`
    - Implement: assistance request CRUD with status transitions `pending → assigned → completed`
    - Implement: recurring booking CRUD and `expandRecurringBooking` — import `rrule` from `https://esm.sh/rrule@2`; default horizon 90 days; enforce max 365 days (return 400 if exceeded); skip conflicting instances; response: `{ created: N, skipped: N, instances: [...] }`
    - Deploy: `npx supabase functions deploy venue`
    - _Requirements: 1.1–1.7, 2.1–2.5, 9.1–9.5_

  - [ ] 6.2 Add VenueClient to @studio/client
    - Create schemas, types, client for venue module
    - Mirror schemas to `supabase/functions/_shared/schemas/venue.ts`
    - Export from index
    - _Requirements: 3.2, 3.8, 16.1, 16.3, 16.4_

  - [ ] 6.3 Migrate apps/web venue pages to VenueClient
    - Switch `/venue`, `/reservations/*` pages to V2 hooks
    - _Requirements: 4.1, 4.2, 4.5, 4.7, 15.1, 15.2_

  - [ ] 6.4 Remove venue server actions and rename V2 hooks
    - Delete booking and venue assistance actions from `db.ts`, `venue-assistance.ts`, `venue-assistance-status.ts`
    - Rename V2 hooks
    - Update migration status tracker: Venue ✅
    - _Requirements: 4.1, 15.4_

- [ ] 7. Phase 6 — Approvals Module
  - [ ] 7.1 Create approvals Edge Function
    - Create `supabase/functions/approvals/index.ts`
    - Implement: `listApprovals`, `createApproval` (status starts as `pending`), `getApproval`
    - Implement: `approveRequest` and `rejectRequest` — both: (a) 409 if `status != 'pending'`; (b) resolve approver's Worker via `userId → Worker.firebaseUid → WorkerRole → Role → RolePermission`; (c) 403 if no role has `approve_requests` permission; (d) set `status`, `approverId`, `approvedAt`, `approverNotes`
    - Deploy: `npx supabase functions deploy approvals`
    - _Requirements: 1.1–1.7, 2.1–2.5, 10.1–10.5_

  - [ ] 7.2 Add ApprovalsClient to @studio/client
    - Create schemas, types, client for approvals module
    - Mirror schemas to `supabase/functions/_shared/schemas/approvals.ts`
    - Export from index
    - _Requirements: 3.2, 3.8, 16.1, 16.3, 16.4_

  - [ ] 7.3 Migrate apps/web approvals pages to ApprovalsClient
    - Switch `/approvals` page to V2 hooks
    - _Requirements: 4.1, 4.2, 4.5, 4.7, 15.1, 15.2_

  - [ ] 7.4 Remove approvals server actions and rename V2 hooks
    - Delete `createApproval`, `getApprovals`, `updateApproval` from `db.ts`
    - Rename V2 hooks
    - Update migration status tracker: Approvals ✅
    - _Requirements: 4.1, 15.4_

- [ ] 8. Phase 7 — Meals Module
  - [ ] 8.1 Create meals Edge Function
    - Create `supabase/functions/meals/index.ts`
    - **Register `POST /meal-stubs/allocate` before `POST /meal-stubs/:id`** in the RouteMap
    - Implement: `listMealStubs`, `createMealStub`, `getMealStub`, `updateMealStub`, `deleteMealStub`
    - Implement: `allocateMealStubs` — body: `{ workerIds: string[], serviceDate: string }`; idempotent (skip workers who already have a stub for that date); bulk insert
    - Implement: `redeemMealStub` — set `redeemed = true`, `redeemedAt = now()`, `redeemedByWorkerId` from body; 409 if `redeemed` is already `true`
    - Deploy: `npx supabase functions deploy meals`
    - _Requirements: 1.1–1.7, 2.1–2.5, 11.1–11.4_

  - [ ] 8.2 Add MealsClient to @studio/client
    - Create schemas, types, client for meals module
    - Mirror schemas to `supabase/functions/_shared/schemas/meals.ts`
    - Export from index
    - _Requirements: 3.2, 3.8, 16.1, 16.3, 16.4_

  - [ ] 8.3 Migrate apps/web meals pages to MealsClient
    - Switch `/meals`, `/mealstub/scanner` pages to V2 hooks
    - _Requirements: 4.1, 4.2, 4.5, 4.7, 15.1, 15.2_

  - [ ] 8.4 Remove meals server actions and rename V2 hooks
    - Delete meal stub actions from `db.ts`
    - Delete `apps/web/src/app/api/mealstubs/` API route
    - Rename V2 hooks
    - Update migration status tracker: Meals ✅
    - _Requirements: 4.1, 15.4_

- [ ] 9. Phase 8 — Attendance Module
  - [ ] 9.1 Create attendance Edge Function
    - Create `supabase/functions/attendance/index.ts`
    - **Register `POST /attendance/scan` and `GET /attendance/stats` before `GET /attendance/:id`** in the RouteMap
    - Implement: `listAttendance`, `createAttendance` (409 on duplicate `(workerId, serviceDate)`), `getAttendance`
    - Implement: `scanQRCode` — (1) verify QR JWT using `SUPABASE_JWT_SECRET` (the QR payload is a JWT with claims `{ workerId: string, iat: number }`); (2) check `Worker.status = 'active'` for decoded `workerId`, return 404 if not found/inactive; (3) insert attendance for `(workerId, serviceDate)` where `serviceDate` defaults to today; (4) return 409 on duplicate
    - Implement: `getAttendanceStats` — filter by `?startDate=&endDate=&ministryId=`; return `{ totalCount, byDate: [{date, count}], byMinistry: [{ministryId, ministryName, count}] }`
    - Deploy: `npx supabase functions deploy attendance`
    - _Requirements: 1.1–1.7, 2.1–2.5, 12.1–12.5_

  - [ ] 9.2 Add AttendanceClient to @studio/client
    - Create schemas, types, client for attendance module
    - Mirror schemas to `supabase/functions/_shared/schemas/attendance.ts`
    - Export from index
    - _Requirements: 3.2, 3.8, 16.1, 16.3, 16.4_

  - [ ] 9.3 Migrate apps/web attendance pages to AttendanceClient
    - Switch `/attendance`, `/attendance/scanner`, `/scan` pages to V2 hooks
    - _Requirements: 4.1, 4.2, 4.5, 4.7, 15.1, 15.2_

  - [ ] 9.4 Remove attendance server actions and rename V2 hooks
    - Delete `getAttendanceRecords`, `createAttendanceRecord`, `getScanLogs`, `createScanLog` from `db.ts`
    - Rename V2 hooks
    - Update migration status tracker: Attendance ✅
    - _Requirements: 4.1, 15.4_

- [ ] 10. Phase 9 — C2S Module
  - [ ] 10.1 Create c2s Edge Function
    - Create `supabase/functions/c2s/index.ts`
    - Implement: `listGroups`, `createGroup`, `getGroup` (includes `leader` full Worker profile and `memberCount` integer), `updateGroup`, `deleteGroup`
    - Implement: `listMembers`, `addMember` (validate worker exists; return 404 if not), `removeMember`
    - Deploy: `npx supabase functions deploy c2s`
    - _Requirements: 1.1–1.7, 2.1–2.5, 14.1–14.3_

  - [ ] 10.2 Add C2SClient to @studio/client
    - Create schemas, types, client for c2s module
    - Mirror schemas to `supabase/functions/_shared/schemas/c2s.ts`
    - Export from index
    - _Requirements: 3.2, 3.8, 16.1, 16.3, 16.4_

  - [ ] 10.3 Migrate apps/web c2s pages to C2SClient
    - Switch `/c2s` page to V2 hooks
    - _Requirements: 4.1, 4.2, 4.5, 4.7, 15.1, 15.2_

  - [ ] 10.4 Remove c2s server actions and rename V2 hooks
    - Delete c2s group and mentee actions from `db.ts`
    - Rename V2 hooks
    - Update migration status tracker: C2S ✅
    - _Requirements: 4.1, 15.4_

- [ ] 11. Phase 10 — Inventory Module + apps/inventory overhaul
  - [ ] 11.1 Verify atomic stock migration is applied
    - Confirm `adjust_item_stock` function exists: `SELECT proname FROM pg_proc WHERE proname = 'adjust_item_stock'`
    - This was created in Phase 0 task 1.6 and is a hard prerequisite for the inventory Edge Function
    - _Requirements: 13.2, 13.5_

  - [ ] 11.2 Create inventory Edge Function
    - Create `supabase/functions/inventory/index.ts`
    - Implement: `listItems` with `ministryId` scoping — when `ministryId` absent, check for `super_admin` permission; return 403 if lacking; `createItem`, `getItem`, `updateItem`, `deleteItem`
    - Implement: `listCategories`, `createCategory`, `getCategory`, `updateCategory`, `deleteCategory`
    - Implement: `listStockLogs` filtered by `?itemId=&ministryId=&startDate=&endDate=`
    - Implement: `recordStockAdjustment` — calls `supabase.rpc('adjust_item_stock', { p_item_id, p_delta, p_adj_type, p_ministry_id, p_notes })`; response includes `new_quantity` and `actual_delta`
    - Implement: `listBorrowings`, `createBorrowing`, `processReturn`
    - Deploy: `npx supabase functions deploy inventory`
    - _Requirements: 1.1–1.7, 2.1–2.5, 13.1–13.6_

  - [ ] 11.3 Add InventoryClient to @studio/client
    - Create schemas, types, client for inventory module
    - Mirror schemas to `supabase/functions/_shared/schemas/inventory.ts`
    - Export from index
    - _Requirements: 3.2, 3.8, 16.1, 16.3, 16.4_

  - [ ] 11.4 Migrate apps/inventory to InventoryClient
    - Replace all Supabase client calls in `apps/inventory/src/lib/inventory-api.ts` with `InventoryClient`
    - Update `apps/inventory/src/hooks/useInventory.ts` to use `InventoryClient`
    - Verify items, categories, borrowings, stock logs, and dashboard stats work end-to-end
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 11.5 Remove direct Supabase dependency from apps/inventory
    - Remove `@supabase/supabase-js` from `apps/inventory/package.json`
    - Remove `apps/inventory/src/lib/supabase.ts`
    - Verify `apps/inventory` builds without Supabase client dependency
    - Update migration status tracker: Inventory ✅
    - _Requirements: 5.4_

- [ ] 12. Phase 11 — Final Cleanup
  - [ ] 12.1 Remove @studio/database and @prisma/client from apps/web
    - Verify migration status tracker shows all 10 modules complete
    - Remove `@studio/database` from `apps/web/package.json`
    - Remove `@prisma/client` from `apps/web/package.json`
    - _Requirements: 4.3, 4.4_

  - [ ] 12.2 Delete remaining db.ts server actions and the file
    - Migrate or delete `getSetting`, `updateSetting` to settings Edge Function if still needed
    - Delete `getPermissions`, `setRolePermissions`, `setRolePermissionsByKeys`
    - Delete any remaining functions
    - Delete `apps/web/src/actions/db.ts` entirely once empty
    - _Requirements: 4.1, 15.4_

  - [ ] 12.3 Update turbo.json and verify build
    - Add `@studio/client` to all relevant `turbo.json` pipeline dependencies
    - Run `turbo build` and confirm clean build
    - Run schema sync check: `turbo run check-schema-sync` — confirm no drift
    - _Requirements: 3.1_

  - [ ] 12.4 Update CODEBASE_GUIDE.txt
    - Update architecture section to reflect Edge Functions + `@studio/client` pattern
    - Update KEY FILES to reference new package locations
    - Add Edge Functions deployment instructions
    - Note: `apps/tract-tracker` uses Supabase Auth directly and is NOT part of this migration
    - _Requirements: 15.5_

  - [ ] 12.5 Final verification
    - Run full build: `turbo build`
    - Verify all 10 Edge Functions deployed: `npx supabase functions list`
    - Smoke test each module via the web app
    - Verify `apps/inventory` works end-to-end
    - Confirm no direct Prisma or Supabase client calls remain in `apps/web` or `apps/inventory`
    - Run schema sync check: no drift
    - Update all migration status tracker rows to ✅
    - _Requirements: 4.2, 4.3, 4.4, 5.2, 5.4, 15.5_

---

## Notes

- **Route ordering is critical.** In every Edge Function, literal path segments (e.g., `/schedules/from-template`, `/meal-stubs/allocate`, `/attendance/scan`, `/attendance/stats`, `/workers/lookup`) must appear before parameterized routes of the same depth in the `RouteMap` array. Iterating an object map has non-deterministic ordering; the `RouteMap` array guarantees evaluation order.
- **`dbRole` ≠ application role.** `AuthContext.dbRole` is the Supabase database role (`authenticated`). Application-level authorization always requires querying `WorkerRole → Role → RolePermission`. Never use `dbRole` for business logic permission checks.
- **Concurrent stock updates require the Postgres RPC.** A plain `UPDATE SET quantity = quantity - delta` allows two concurrent requests to read the same pre-update value. The `adjust_item_stock` RPC uses `SELECT ... FOR UPDATE` to serialize access.
- **QR codes are signed JWTs** using `SUPABASE_JWT_SECRET`. The attendance Edge Function verifies the signature before trusting `workerId` in the payload.
- **Zod schemas in `packages/client/src/` are the source of truth.** Their mirrors in `supabase/functions/_shared/schemas/` must be kept in sync; CI will reject divergence.
- Each phase is independently deployable — old server actions remain until pages are fully switched and verified on the new client hooks.
- `apps/tract-tracker` uses Supabase Auth directly and is NOT part of this migration.
- Edge Functions are deployed to Supabase project `vpgykxfbrfnojmgmzriq`.
