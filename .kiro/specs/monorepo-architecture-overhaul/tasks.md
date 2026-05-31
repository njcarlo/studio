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
    - Verify link with `npx supabase status`
    - _Requirements: 1.2_

  - [ ] 1.2 Create shared Edge Function utilities
    - Create `supabase/functions/_shared/cors.ts` — CORS headers and OPTIONS handler
    - Create `supabase/functions/_shared/auth.ts` — JWT verification helper
    - Create `supabase/functions/_shared/router.ts` — route matching with path parameter extraction
    - Create `supabase/functions/_shared/response.ts` — `jsonResponse()` helper
    - Create `supabase/functions/_shared/errors.ts` — typed error classes and error response helpers
    - _Requirements: 1.3, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 2.4, 2.5, 17.1, 17.2_

  - [ ] 1.3 Scaffold @studio/client package
    - Create `packages/client/package.json` with name `@studio/client`, dependencies on `zod`
    - Create `packages/client/tsconfig.json` extending root tsconfig
    - Create `packages/client/src/base-client.ts` — `BaseClient` class with `request<T>()` method and `ClientError` class
    - Create `packages/client/src/index.ts` — main exports barrel
    - Add `@studio/client` to `turbo.json` pipeline
    - Add `@studio/client: "*"` to `apps/web/package.json` and `apps/inventory/package.json` dependencies
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ] 1.4 Set up Supabase Edge Function secrets
    - Run `npx supabase secrets set SUPABASE_URL=<value>` for the project URL
    - Run `npx supabase secrets set SUPABASE_ANON_KEY=<value>` for the anon key
    - Run `npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<value>` for the service role key
    - Document required secrets in `supabase/functions/.env.example`
    - _Requirements: 2.1_

- [ ] 2. Phase 1 — Settings Module
  - [ ] 2.1 Create settings Edge Function
    - Create `supabase/functions/settings/index.ts` using the complete implementation from the design doc
    - Implement handlers: `listRoles`, `getRole`, `createRole`, `updateRole`, `deleteRole` (with worker assignment check)
    - Implement handlers: `listRooms`, `createRoom`, `updateRoom`, `deleteRoom` (with active reservation check)
    - Implement handlers: `listDepartments`, `createDepartment`, `updateDepartment`, `deleteDepartment`
    - Implement handlers: `listVenueElements`, `createVenueElement`, `updateVenueElement`, `deleteVenueElement`
    - Deploy with `npx supabase functions deploy settings`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 18.1, 18.2, 18.3, 18.4, 18.5_

  - [ ] 2.2 Add SettingsClient to @studio/client
    - Create `packages/client/src/settings/types.ts` — Role, Room, Department, VenueElement types and Zod schemas
    - Create `packages/client/src/settings/client.ts` — `SettingsClient` extending `BaseClient`
    - Export `SettingsClient` and all types from `packages/client/src/index.ts`
    - _Requirements: 3.2, 3.8, 16.1, 16.3, 16.4_

  - [ ] 2.3 Migrate apps/web settings pages to SettingsClient
    - Update `apps/web/src/hooks/use-roles.ts` to use `SettingsClient` instead of `getRoles`, `createRole`, `updateRole`, `deleteRole` from `db.ts`
    - Update `apps/web/src/hooks/use-rooms.ts` to use `SettingsClient`
    - Update `apps/web/src/hooks/use-departments.ts` to use `SettingsClient`
    - Update `apps/web/src/hooks/use-venue-elements.ts` to use `SettingsClient`
    - Verify `/settings/roles`, `/settings/rooms`, `/settings/departments`, `/settings/venue-elements` pages work correctly
    - _Requirements: 4.1, 4.2, 4.5, 4.7, 15.1, 15.2_

  - [ ] 2.4 Remove settings server actions from db.ts
    - Delete `getRoles`, `getRoleById`, `createRole`, `updateRole`, `deleteRole` from `apps/web/src/actions/db.ts`
    - Delete `getRooms`, `createRoom`, `updateRoom`, `deleteRoom`, `createRooms` from `apps/web/src/actions/db.ts`
    - Delete `getAreas`, `createArea`, `updateArea`, `deleteArea`, `createAreas` from `apps/web/src/actions/db.ts`
    - Delete `getBranches`, `createBranch`, `updateBranch`, `deleteBranch` from `apps/web/src/actions/db.ts`
    - Delete `getVenueElements`, `createVenueElement`, `updateVenueElement`, `deleteVenueElement` from `apps/web/src/actions/db.ts`
    - _Requirements: 4.1, 15.4_

- [ ] 3. Phase 2 — Workers Module
  - [ ] 3.1 Create workers Edge Function
    - Create `supabase/functions/workers/index.ts` using the complete implementation from the design doc
    - Implement handlers: `listWorkers`, `getWorker`, `createWorker`, `updateWorker`, `deleteWorker` (soft delete with assignment check)
    - Implement handlers: `getWorkerRoles`, `assignRole`, `removeRole`, `getWorkerPermissions`
    - Deploy with `npx supabase functions deploy workers`
    - _Requirements: 1.1, 1.2, 2.1, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 3.2 Add WorkersClient to @studio/client
    - Create `packages/client/src/workers/types.ts` — Worker, WorkerRole, Permission types and Zod schemas
    - Create `packages/client/src/workers/client.ts` — `WorkersClient` extending `BaseClient`
    - Export from `packages/client/src/index.ts`
    - _Requirements: 3.2, 3.8, 16.1, 16.3, 16.4_

  - [ ] 3.3 Migrate apps/web workers pages to WorkersClient
    - Update `apps/web/src/hooks/use-workers.ts` to use `WorkersClient`
    - Update `apps/web/src/hooks/use-worker-mutations.ts` to use `WorkersClient`
    - Update `apps/web/src/hooks/use-worker-logs.ts` to use `WorkersClient`
    - Verify `/workers`, `/workers/[id]`, `/workers/my-qr` pages work correctly
    - _Requirements: 4.1, 4.2, 4.5, 4.7, 15.1, 15.2_

  - [ ] 3.4 Remove workers server actions from db.ts
    - Delete `getWorkers`, `getPaginatedWorkers`, `getWorkerStats`, `getWorkerById`, `getWorkerByEmail` from `db.ts`
    - Delete `createWorker`, `updateWorker`, `deleteWorker`, `deleteWorkers` from `db.ts`
    - Delete `getWorkerRoles`, `assignRolesToWorker` from `db.ts`
    - Delete `updateWorkersMinistries` from `db.ts`
    - _Requirements: 4.1, 15.4_

- [ ] 4. Phase 3 — Ministries Module
  - [ ] 4.1 Create ministries Edge Function
    - Create `supabase/functions/ministries/index.ts` using the complete implementation from the design doc
    - Implement handlers: `listMinistries`, `getMinistry`, `createMinistry`, `updateMinistry`, `deleteMinistry` (with worker assignment check)
    - Implement handlers: `listWorkloadCategories`, `createWorkloadCategory`, `updateWorkloadCategory`, `deleteWorkloadCategory`
    - Implement handlers: `assignManager`, `removeManager`
    - Deploy with `npx supabase functions deploy ministries`
    - _Requirements: 1.1, 1.2, 2.1, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 4.2 Add MinistriesClient to @studio/client
    - Create `packages/client/src/ministries/types.ts` — Ministry, WorkloadCategory, MinistryManager types and Zod schemas
    - Create `packages/client/src/ministries/client.ts` — `MinistriesClient` extending `BaseClient`
    - Export from `packages/client/src/index.ts`
    - _Requirements: 3.2, 3.8, 16.1, 16.3, 16.4_

  - [ ] 4.3 Migrate apps/web ministries pages to MinistriesClient
    - Update `apps/web/src/hooks/use-ministries.ts` to use `MinistriesClient`
    - Update `apps/web/src/hooks/use-workload-categories.ts` to use `MinistriesClient`
    - Verify `/ministries`, `/settings/ministries` pages work correctly
    - _Requirements: 4.1, 4.2, 4.5, 4.7, 15.1, 15.2_

  - [ ] 4.4 Remove ministries server actions from db.ts
    - Delete `getMinistries`, `createMinistry`, `updateMinistry`, `createMinistries`, `deleteMinistry` from `db.ts`
    - Delete workload category actions from `apps/web/src/actions/ministry-categories.ts`
    - _Requirements: 4.1, 15.4_

- [ ] 5. Phase 4 — Schedule Module
  - [ ] 5.1 Create schedule Edge Function
    - Create `supabase/functions/schedule/index.ts` using the complete implementation from the design doc
    - Implement handlers: `listSchedules`, `getSchedule`, `createSchedule`, `createFromTemplate`, `updateSchedule`, `deleteSchedule`
    - Implement handlers: `assignWorker` (with role validation), `removeAssignment`
    - Implement handlers: `listTemplates`, `createTemplate`, `updateTemplate`, `deleteTemplate`
    - Deploy with `npx supabase functions deploy schedule`
    - _Requirements: 1.1, 1.2, 2.1, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 5.2 Add ScheduleClient to @studio/client
    - Create `packages/client/src/schedule/types.ts` — Schedule, ScheduleAssignment, ServiceTemplate, TemplateRole, WorshipSlot types and Zod schemas
    - Create `packages/client/src/schedule/client.ts` — `ScheduleClient` extending `BaseClient`
    - Export from `packages/client/src/index.ts`
    - _Requirements: 3.2, 3.8, 16.1, 16.3, 16.4_

  - [ ] 5.3 Migrate apps/web schedule pages to ScheduleClient
    - Update `apps/web/src/hooks/use-schedule.ts` to use `ScheduleClient`
    - Verify `/schedule`, `/schedule/[id]`, `/schedule/templates`, `/schedule/schedulers` pages work correctly
    - _Requirements: 4.1, 4.2, 4.5, 4.7, 15.1, 15.2_

  - [ ] 5.4 Remove schedule server actions
    - Delete all functions from `apps/web/src/actions/schedule.ts`
    - _Requirements: 4.1, 15.4_

- [ ] 6. Phase 5 — Venue Module
  - [ ] 6.1 Create venue Edge Function
    - Create `supabase/functions/venue/index.ts` using the complete implementation from the design doc
    - Implement handlers: `listReservations`, `getReservation`, `createReservation` (with conflict check), `updateReservation`, `deleteReservation`, `checkConflict`
    - Implement handlers: `listAssistanceRequests`, `createAssistanceRequest`, `updateAssistanceRequest`
    - Implement handlers: `listRecurringBookings`, `createRecurringBooking`, `expandRecurringBooking`
    - Deploy with `npx supabase functions deploy venue`
    - _Requirements: 1.1, 1.2, 2.1, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 6.2 Add VenueClient to @studio/client
    - Create `packages/client/src/venue/types.ts` — Reservation, AssistanceRequest, RecurringBooking types and Zod schemas
    - Create `packages/client/src/venue/client.ts` — `VenueClient` extending `BaseClient`
    - Export from `packages/client/src/index.ts`
    - _Requirements: 3.2, 3.8, 16.1, 16.3, 16.4_

  - [ ] 6.3 Migrate apps/web venue pages to VenueClient
    - Update `apps/web/src/hooks/use-venue-bookings.ts` to use `VenueClient`
    - Update `apps/web/src/hooks/use-bookings.ts` to use `VenueClient`
    - Update `apps/web/src/hooks/use-assistance-requests.ts` to use `VenueClient`
    - Verify `/venue`, `/reservations/*` pages work correctly
    - _Requirements: 4.1, 4.2, 4.5, 4.7, 15.1, 15.2_

  - [ ] 6.4 Remove venue server actions from db.ts
    - Delete `getBookings`, `getBookingsForRoomOnDate`, `createBooking`, `updateBooking`, `deleteBooking` from `db.ts`
    - Delete venue assistance actions from `apps/web/src/actions/venue-assistance.ts` and `venue-assistance-status.ts`
    - _Requirements: 4.1, 15.4_

- [ ] 7. Phase 6 — Approvals Module
  - [ ] 7.1 Create approvals Edge Function
    - Create `supabase/functions/approvals/index.ts` using the complete implementation from the design doc
    - Implement handlers: `listApprovals`, `getApproval`, `createApproval`
    - Implement handlers: `approveRequest` (with permission check and pending-only guard), `rejectRequest` (same guards)
    - Deploy with `npx supabase functions deploy approvals`
    - _Requirements: 1.1, 1.2, 2.1, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ] 7.2 Add ApprovalsClient to @studio/client
    - Create `packages/client/src/approvals/types.ts` — ApprovalRequest types and Zod schemas
    - Create `packages/client/src/approvals/client.ts` — `ApprovalsClient` extending `BaseClient`
    - Export from `packages/client/src/index.ts`
    - _Requirements: 3.2, 3.8, 16.1, 16.3, 16.4_

  - [ ] 7.3 Migrate apps/web approvals pages to ApprovalsClient
    - Update `apps/web/src/hooks/use-approvals.ts` to use `ApprovalsClient`
    - Update `apps/web/src/hooks/use-approval-mutations.ts` to use `ApprovalsClient`
    - Verify `/approvals` page works correctly
    - _Requirements: 4.1, 4.2, 4.5, 4.7, 15.1, 15.2_

  - [ ] 7.4 Remove approvals server actions from db.ts
    - Delete `createApproval`, `getApprovals`, `updateApproval` from `db.ts`
    - _Requirements: 4.1, 15.4_

- [ ] 8. Phase 7 — Meals Module
  - [ ] 8.1 Create meals Edge Function
    - Create `supabase/functions/meals/index.ts` using the complete implementation from the design doc
    - Implement handlers: `listMealStubs`, `getMealStub`, `createMealStub`, `updateMealStub`, `deleteMealStub`
    - Implement handlers: `allocateMealStubs` (bulk create for worker list), `redeemMealStub` (with duplicate redemption check)
    - Deploy with `npx supabase functions deploy meals`
    - _Requirements: 1.1, 1.2, 2.1, 11.1, 11.2, 11.3, 11.4_

  - [ ] 8.2 Add MealsClient to @studio/client
    - Create `packages/client/src/meals/types.ts` — MealStub types and Zod schemas
    - Create `packages/client/src/meals/client.ts` — `MealsClient` extending `BaseClient`
    - Export from `packages/client/src/index.ts`
    - _Requirements: 3.2, 3.8, 16.1, 16.3, 16.4_

  - [ ] 8.3 Migrate apps/web meals pages to MealsClient
    - Update `apps/web/src/hooks/use-meal-stubs.ts` to use `MealsClient`
    - Update `apps/web/src/services/mealstubService.ts` to use `MealsClient`
    - Verify `/meals`, `/mealstub/scanner` pages work correctly
    - _Requirements: 4.1, 4.2, 4.5, 4.7, 15.1, 15.2_

  - [ ] 8.4 Remove meals server actions from db.ts
    - Delete `getMealStubs`, `createMealStub`, `updateMealStub`, `deleteMealStub` from `db.ts`
    - Delete `apps/web/src/app/api/mealstubs/` API route
    - _Requirements: 4.1, 15.4_

- [ ] 9. Phase 8 — Attendance Module
  - [ ] 9.1 Create attendance Edge Function
    - Create `supabase/functions/attendance/index.ts` using the complete implementation from the design doc
    - Implement handlers: `listAttendance`, `getAttendance`, `createAttendance`
    - Implement handlers: `scanQRCode` (validate active worker, duplicate check), `getAttendanceStats` (aggregate by date + ministry)
    - Deploy with `npx supabase functions deploy attendance`
    - _Requirements: 1.1, 1.2, 2.1, 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ] 9.2 Add AttendanceClient to @studio/client
    - Create `packages/client/src/attendance/types.ts` — AttendanceRecord types and Zod schemas
    - Create `packages/client/src/attendance/client.ts` — `AttendanceClient` extending `BaseClient`
    - Export from `packages/client/src/index.ts`
    - _Requirements: 3.2, 3.8, 16.1, 16.3, 16.4_

  - [ ] 9.3 Migrate apps/web attendance pages to AttendanceClient
    - Update `apps/web/src/hooks/use-attendance.ts` to use `AttendanceClient`
    - Update `apps/web/src/hooks/use-scan-logs.ts` to use `AttendanceClient`
    - Verify `/attendance`, `/attendance/scanner`, `/scan` pages work correctly
    - _Requirements: 4.1, 4.2, 4.5, 4.7, 15.1, 15.2_

  - [ ] 9.4 Remove attendance server actions from db.ts
    - Delete `getAttendanceRecords`, `createAttendanceRecord` from `db.ts`
    - Delete `getScanLogs`, `createScanLog` from `db.ts`
    - _Requirements: 4.1, 15.4_

- [ ] 10. Phase 9 — C2S Module
  - [ ] 10.1 Create c2s Edge Function
    - Create `supabase/functions/c2s/index.ts` using the complete implementation from the design doc
    - Implement handlers: `listGroups` (with member count), `getGroup` (with leader profile + member count), `createGroup`, `updateGroup`, `deleteGroup`
    - Implement handlers: `addMember` (validate worker exists), `removeMember`
    - Deploy with `npx supabase functions deploy c2s`
    - _Requirements: 1.1, 1.2, 2.1, 14.1, 14.2, 14.3_

  - [ ] 10.2 Add C2SClient to @studio/client
    - Create `packages/client/src/c2s/types.ts` — DiscipleshipGroup, GroupMember types and Zod schemas
    - Create `packages/client/src/c2s/client.ts` — `C2SClient` extending `BaseClient`
    - Export from `packages/client/src/index.ts`
    - _Requirements: 3.2, 3.8, 16.1, 16.3, 16.4_

  - [ ] 10.3 Migrate apps/web c2s pages to C2SClient
    - Update c2s data fetching in `apps/web/src/app/c2s/page.tsx` to use `C2SClient`
    - Verify `/c2s` page works correctly
    - _Requirements: 4.1, 4.2, 4.5, 4.7, 15.1, 15.2_

  - [ ] 10.4 Remove c2s server actions from db.ts
    - Delete `getC2SGroups`, `getC2SMentees`, `createC2SGroup`, `updateC2SGroup`, `deleteC2SGroup` from `db.ts`
    - Delete `createC2SMentee`, `updateC2SMentee`, `deleteC2SMentee` from `db.ts`
    - _Requirements: 4.1, 15.4_

- [ ] 11. Phase 10 — Inventory Module + apps/inventory overhaul
  - [ ] 11.1 Create inventory Edge Function
    - Create `supabase/functions/inventory/index.ts` using the complete implementation from the design doc
    - Implement handlers: `listItems` (with ministryId scoping), `getItem`, `createItem`, `updateItem`, `deleteItem`
    - Implement handlers: `listCategories`, `createCategory`, `updateCategory`, `deleteCategory`
    - Implement handlers: `recordStockAdjustment` (atomic quantity update, clamp to zero on Stock Out), `listStockLogs`
    - Implement handlers: `listBorrowings`, `createBorrowing` (check availability), `processReturn` (update quantity)
    - Deploy with `npx supabase functions deploy inventory`
    - _Requirements: 1.1, 1.2, 2.1, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [ ] 11.2 Add InventoryClient to @studio/client
    - Create `packages/client/src/inventory/types.ts` — InventoryItem, InventoryCategory, StockLog, Borrowing types and Zod schemas
    - Create `packages/client/src/inventory/client.ts` — `InventoryClient` extending `BaseClient`
    - Export from `packages/client/src/index.ts`
    - _Requirements: 3.2, 3.8, 16.1, 16.3, 16.4_

  - [ ] 11.3 Migrate apps/inventory to InventoryClient
    - Replace all direct Supabase calls in `apps/inventory/src/lib/inventory-api.ts` with `InventoryClient` calls
    - Update `apps/inventory/src/hooks/useInventory.ts` to use `InventoryClient`
    - Verify all inventory features work: items, categories, borrowings, stock logs, dashboard stats
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 11.4 Remove direct Supabase dependency from apps/inventory
    - Remove `@supabase/supabase-js` from `apps/inventory/package.json`
    - Remove `apps/inventory/src/lib/supabase.ts` direct client file
    - Verify `apps/inventory` builds without Supabase client dependency
    - _Requirements: 5.4_

- [ ] 12. Phase 11 — Final Cleanup
  - [ ] 12.1 Remove @studio/database from apps/web
    - Verify all modules have been migrated (check migration status tracker above)
    - Remove `@studio/database` from `apps/web/package.json` dependencies
    - Remove `@prisma/client` from `apps/web/package.json` dependencies
    - Remove `apps/web/src/firebase/index.ts` re-export if no longer needed
    - _Requirements: 4.3, 4.4_

  - [ ] 12.2 Remove remaining db.ts server actions
    - Delete `getSetting`, `updateSetting` from `db.ts` (migrate to settings Edge Function if needed)
    - Delete `getPermissions`, `setRolePermissions`, `setRolePermissionsByKeys` from `db.ts`
    - Delete any remaining functions from `db.ts`
    - Delete `apps/web/src/actions/db.ts` entirely once empty
    - _Requirements: 4.1, 15.4_

  - [ ] 12.3 Update turbo.json and package configs
    - Add `@studio/client` to all relevant `turbo.json` pipeline dependencies
    - Verify monorepo builds cleanly with `turbo build`
    - _Requirements: 3.1_

  - [ ] 12.4 Update CODEBASE_GUIDE.txt
    - Update architecture section to reflect Edge Functions + @studio/client pattern
    - Update KEY FILES section to reference new package locations
    - Update HOOKS section to reflect new client-based hooks
    - Add Edge Functions deployment instructions
    - _Requirements: 15.5_

  - [ ] 12.5 Final verification
    - Run full build: `turbo build`
    - Verify all 10 Edge Functions are deployed: `npx supabase functions list`
    - Smoke test each module via the web app
    - Verify apps/inventory works end-to-end
    - Confirm no direct Prisma or Supabase client calls remain in apps/web or apps/inventory
    - Update migration status tracker to mark all modules complete
    - _Requirements: 4.2, 4.3, 4.4, 5.2, 5.4, 15.5_

## Notes

- Each phase is independently deployable — old server actions stay until the phase is fully verified
- The migration status tracker at the top of this file should be updated as each module completes
- Edge Functions are deployed to Supabase project `vpgykxfbrfnojmgmzriq`
- The `supabase/functions/_shared/` utilities are shared across all Edge Functions via Deno import paths
- All Edge Functions use the same JWT verification pattern — unauthenticated requests return 401 before any handler runs
- The `@studio/client` package works in both browser (Next.js) and React Native (Expo) environments
- apps/tract-tracker uses Supabase Auth directly and is NOT part of this migration
