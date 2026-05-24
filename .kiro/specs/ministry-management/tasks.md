# Implementation Plan: Ministry Management — Workload Categories

## Overview

Extend the Ministry Management module to support per-ministry Workload Categories and a Ministry Manager role. The implementation follows the existing COG App layered architecture: Prisma schema → server actions → React Query hooks → UI components → scheduling module integration.

## Tasks

### Phase 1: Foundation & Data Layer

- [x] 1. Database schema changes
  - Add `WorkloadCategory` model to `prisma/schema.prisma` with fields: `id`, `ministryId`, `name`, `description` (`VarChar(255)`), `sortOrder`, `createdAt`, `updatedAt`; add `@@unique([ministryId, name])` and `@@index([ministryId, sortOrder])`
  - Add `managerId String?` field to the `Ministry` model in `prisma/schema.prisma`
  - Add `capabilities String[]` to `Worker` model
  - _Requirements: 2.1, 6.1, 8.1, 10.1_

- [x] 2. Prisma migration
  - Run `npx prisma migrate dev --name add_ministry_workload_categories` from the repo root to generate and apply the migration SQL
  - Run `npx prisma generate` to regenerate the Prisma client
  - _Requirements: 10.1_

- [x] 3. TypeScript types — `packages/types/index.ts`
  - Add `WorkloadCategory` interface with fields matching the Prisma model (`id`, `ministryId`, `name`, `description`, `sortOrder`, `createdAt`, `updatedAt`)
  - Add `managerId?: string | null` to the existing `Ministry` type
  - Update `Worker` type to include `capabilities: string[]`
  - _Requirements: 2.1, 8.1_

- [x] 4. Server actions — `apps/web/src/actions/ministry-categories.ts`
  - [x] 4.1 Implement `assertCategoryManager(ministryId, callerId)` helper
    - Query `WorkerRole` → `RolePermission` to check `canManageMinistries`; also check `ministry.headId === callerId` and `ministry.managerId === callerId`
    - Throw `Error('UNAUTHENTICATED')` when `callerId` is absent/empty; throw `Error('UNAUTHORIZED')` when none of the three conditions match
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 4.2 Implement `getWorkloadCategories(ministryId)`
    - `prisma.workloadCategory.findMany({ where: { ministryId }, orderBy: { sortOrder: 'asc' } })`
    - No auth check (read-only, used by scheduling dropdowns)
    - _Requirements: 1.1, 1.4, 11.1, 11.5_

  - [x] 4.3 Implement `createWorkloadCategory(data)`
    - Validate name is non-empty/non-whitespace (throw `INVALID_NAME`); validate description ≤ 255 chars (throw `DESCRIPTION_TOO_LONG`)
    - Case-insensitive duplicate check scoped to `ministryId` (throw `DUPLICATE_NAME`)
    - Call `assertCategoryManager`; set `sortOrder` to `(max existing sortOrder + 1)`; call `prisma.workloadCategory.create`; catch Prisma `P2002` and re-throw as `DUPLICATE_NAME`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 9.1_

  - [x] 4.4 Implement `updateWorkloadCategory(id, data)`
    - Fetch existing category to get `ministryId`; call `assertCategoryManager`
    - Validate name (if provided) and description length; case-insensitive duplicate check excluding the current record's id
    - `prisma.workloadCategory.update`; catch `P2002` as `DUPLICATE_NAME`
    - _Requirements: 3.1, 3.2, 9.1_

  - [x] 4.5 Implement `deleteWorkloadCategory(id, callerId)`
    - Fetch category to get `ministryId`; call `assertCategoryManager`; `prisma.workloadCategory.delete`
    - _Requirements: 4.1, 7.4, 9.1_

  - [x] 4.6 Implement `reorderWorkloadCategories(data)`
    - Call `assertCategoryManager`; run a `prisma.$transaction` that updates each category's `sortOrder` to its index in `orderedIds`
    - _Requirements: 5.1, 9.1_

  - [x] 4.7 Implement `assignMinistryManager(ministryId, managerId, callerId)`
    - Check caller has `canManageMinistries` (throw `UNAUTHORIZED` otherwise)
    - `prisma.ministry.update({ where: { id: ministryId }, data: { managerId } })`; `revalidatePath('/settings/ministries')`
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 5. React Query hook — `apps/web/src/hooks/use-workload-categories.ts`
  - Create `useWorkloadCategories(ministryId)` following the pattern in `use-ministries.ts`
  - Query key `['workload-categories', ministryId]`; `staleTime: 2 * 60_000`; `enabled: !!ministryId`
  - Expose `categories`, `isLoading`, `createCategory`, `updateCategory`, `deleteCategory`, `reorderCategories` (all mutations invalidate the query key on success)
  - Add `assignMinistryManager` mutation to `useMinistries` hook in `apps/web/src/hooks/use-ministries.ts` that calls the new server action and invalidates `['ministries']`
  - _Requirements: 1.1, 2.5, 3.3, 4.3, 5.2_

- [x] 6. UI — `WorkloadCategoriesSection` inside `MinistryDetailsSheet`
  - [x] 6.1 Create `WorkloadCategoryRow` sub-component
    - Displays category name, optional description, up/down reorder buttons, edit button, delete button
    - Delete button opens an `AlertDialog` confirmation (matching the existing pattern in `ministries/page.tsx`) before calling `deleteCategory`
    - _Requirements: 1.2, 4.2, 4.3_

  - [x] 6.2 Create `WorkloadCategoryForm` inline form
    - Controlled `Input` for name (required) and `Textarea` for description (optional, max 255 chars)
    - Displays inline validation errors for `INVALID_NAME`, `DUPLICATE_NAME`, `DESCRIPTION_TOO_LONG`
    - Used for both create and edit; calls `createCategory` or `updateCategory` on submit
    - _Requirements: 2.2, 2.3, 2.4, 3.1, 3.2, 10.3_

  - [x] 6.3 Create `WorkloadCategoriesSection` component
    - Renders inside `MinistryDetailsSheet` in `apps/web/src/app/settings/ministries/page.tsx`
    - Header row with "Workload Categories" label and "Add Category" button (visible only to Category Managers)
    - Ordered list of `WorkloadCategoryRow` items; empty state message when no categories exist
    - Calls `reorderCategories` with updated `orderedIds` array when up/down buttons are clicked
    - _Requirements: 1.1, 1.3, 1.4, 2.5, 3.3, 4.3, 5.2, 6.1_

- [x] 7. UI — `AppointManagerForm` for Ministry Manager assignment
  - Add `AppointManagerForm` component to `apps/web/src/app/settings/ministries/page.tsx` following the exact pattern of the existing `AppointApproverForm`
  - Add a new `DropdownMenuItem` "Appoint Ministry Manager" (with `UserCog` icon) to the ministry card's `DropdownMenu`, visible only when `canManageMinistries` is true
  - Wire the form to call `assignMinistryManager` from `useMinistries` and show a success/error toast
  - Display the current manager's name in `MinistryDetailsSheet` alongside the other role assignments (leader, head, approver, assigner)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 8. UI — `WorkloadCategorySelect` smart component
  - Create `apps/web/src/components/schedule/WorkloadCategorySelect.tsx`
  - Accept props: `ministryId: string`, `value: string`, `onChange: (value: string) => void`, `placeholder?: string`
  - When `ministryId` is non-empty and `categories.length > 0`: render a `Select` (from `@studio/ui`) with category names as options ordered by `sortOrder`
  - When `ministryId` is empty or `categories.length === 0`: render a plain `Input` for free-text entry
  - _Requirements: 11.1, 11.4, 11.5_

- [x] 9. Scheduling module integration
  - [x] 9.1 Replace `roleName` text input in the "Add Role" dialog in `apps/web/src/app/schedule/[id]/page.tsx`
    - Replace the `Input` bound to `newRoleName` with `WorkloadCategorySelect` passing `ministryId={addRoleDialog}` and `value={newRoleName}` / `onChange={setNewRoleName}`
    - _Requirements: 11.1, 11.4_

  - [x] 9.2 Replace `roleName` text input in the template role rows in `apps/web/src/app/schedule/templates/page.tsx`
    - Replace the `Input` bound to `role.roleName` in the roles list with `WorkloadCategorySelect` passing `ministryId={ministryId}` and the existing `value`/`onChange` handlers
    - _Requirements: 11.2, 11.4_

  - [x] 9.3 Replace `roleInput` text input in the worship slot roles page `apps/web/src/app/schedule/[id]/slots/[slotId]/page.tsx`
    - Determine the worship/music ministry ID from the slot's `scheduleId` context (use the ministry whose `departmentCode === 'W'` or derive from slot context)
    - Replace the `Input` bound to `roleInput` with `WorkloadCategorySelect`; keep the existing `addRole()` call on selection
    - _Requirements: 11.3, 11.4_

- [ ] 10. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Property-based tests — `apps/web/src/__tests__/actions/ministry-categories.property.test.ts`
  - [ ]* 11.1 Write property test for category fetch isolation (Property 1)
    - **Property 1: Category fetch returns only the ministry's own categories**
    - **Validates: Requirements 1.1, 6.1, 6.2**

  - [ ]* 11.2 Write property test for sort order preservation (Property 2)
    - **Property 2: Categories are returned in sort order**
    - **Validates: Requirements 1.4, 5.1, 5.3, 11.5**

  - [ ]* 11.3 Write property test for create–fetch round trip (Property 3)
    - **Property 3: Create–fetch round trip**
    - **Validates: Requirements 2.1, 10.2**

  - [ ]* 11.4 Write property test for whitespace name rejection (Property 4)
    - **Property 4: Whitespace-only names are rejected**
    - **Validates: Requirements 2.2**

  - [ ]* 11.5 Write property test for name uniqueness within a ministry (Property 5)
    - **Property 5: Name uniqueness within a ministry (create and update)**
    - **Validates: Requirements 2.3, 3.2**

  - [ ]* 11.6 Write property test for update–fetch round trip (Property 6)
    - **Property 6: Update–fetch round trip**
    - **Validates: Requirements 3.1**

  - [ ]* 11.7 Write property test for delete–fetch round trip (Property 7)
    - **Property 7: Delete–fetch round trip**
    - **Validates: Requirements 4.1**

  - [ ]* 11.8 Write property test for reorder–fetch round trip (Property 8)
    - **Property 8: Reorder–fetch round trip**
    - **Validates: Requirements 5.1, 5.3**

  - [ ]* 11.9 Write property test for ministry deletion cascade (Property 9)
    - **Property 9: Ministry deletion cascades to categories**
    - **Validates: Requirements 6.3**

  - [ ]* 11.10 Write property test for Ministry Manager assignment idempotence (Property 10)
    - **Property 10: Ministry Manager assignment is at most one**
    - **Validates: Requirements 8.2, 8.3**

  - [ ]* 11.11 Write property test for unauthorized caller rejection (Property 11)
    - **Property 11: Unauthorized callers are rejected for all mutations**
    - **Validates: Requirements 9.1, 9.3, 9.4**

  - [ ]* 11.12 Write property test for unauthenticated request rejection (Property 12)
    - **Property 12: Unauthenticated requests are rejected**
    - **Validates: Requirements 9.5**

  - [ ]* 11.13 Write property test for historical scheduling record immutability (Property 13)
    - **Property 13: Historical scheduling records are not affected by category changes**
    - **Validates: Requirements 11.6**

- [ ] 12. Unit tests — `apps/web/src/__tests__/actions/ministry-categories.test.ts`
  - [ ]* 12.1 Write unit tests for `createWorkloadCategory` server action
    - Valid data creates and returns the category
    - Empty name throws `INVALID_NAME`
    - Whitespace-only name throws `INVALID_NAME`
    - Description > 255 chars throws `DESCRIPTION_TOO_LONG`
    - Duplicate name (case-insensitive) throws `DUPLICATE_NAME`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 12.2 Write unit tests for `updateWorkloadCategory` and `deleteWorkloadCategory`
    - Update with duplicate name throws `DUPLICATE_NAME`
    - Update with valid new name succeeds
    - Delete removes the record
    - _Requirements: 3.1, 3.2, 4.1_

  - [ ]* 12.3 Write unit tests for `assignMinistryManager`
    - Passing `null` clears the manager (`managerId` becomes `null`)
    - Passing a valid worker ID sets the manager
    - Non-admin caller throws `UNAUTHORIZED`
    - _Requirements: 8.1, 8.2, 8.4_

  - [ ]* 12.4 Write unit tests for `WorkloadCategorySelect` component
    - Renders a `Select` when `categories.length > 0`
    - Renders an `Input` when `categories` is empty
    - Renders an `Input` when `ministryId` is empty string
    - _Requirements: 11.1, 11.4_

  - [ ]* 12.5 Write unit tests for `WorkloadCategoriesSection` component
    - Shows empty state message when no categories exist
    - Renders category rows when categories are present
    - Clicking delete shows `AlertDialog` before executing
    - _Requirements: 1.3, 4.2_

  - [ ]* 12.6 Write unit test for `AppointManagerForm`
    - Renders with current manager pre-selected in the dropdown
    - _Requirements: 8.1_

- [ ] 13. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Tasks 1–9 are the core implementation and must be completed in order (each builds on the previous)
- Task 2 (migration) requires `DATABASE_URL` and `DIRECT_URL` to be set in `apps/web/.env`
- `managerId` on `Ministry` has no FK relation declared (matching the design decision to avoid cascade complexity); the server action validates the worker exists before assignment
- Historical `ScheduleAssignment.roleName`, `TemplateRole.roleName`, and `WorshipSlotWorker.role` strings are never modified by category rename/delete — this is by design (Requirement 11.6)
- Property tests use fast-check (already installed at `^4.6.0`) with a Prisma mock via `jest-mock-extended` or a test database
- Run tests with `npm run test` from `apps/web/`
