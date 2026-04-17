# Worker and Room Bugfixes Design

## Overview

This document covers the fix design for two bugs in the `apps/web` application:

1. **Add Worker Sheet Empty**: The `<Sheet>` component on `/workers` is opened by `handleAddNew()` but its `<SheetContent>` contains no JSX — the worker creation form was never placed inside it, so clicking "Add Worker" opens a blank panel.

2. **Room Reservation Always Shows "Profile Not Found"**: On `/reservations/new`, the `roleLoading` guard was placed after the `!workerProfile` check. On first render, `roleLoading` is `true` and `workerProfile` is `undefined`, so the page falls through to the "Worker Profile Not Found" error screen before the hook has finished loading.

Both fixes are minimal, targeted, and must not affect any surrounding functionality.

---

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — the specific input or state that causes incorrect behavior
- **Property (P)**: The desired correct behavior when the bug condition holds
- **Preservation**: Existing behaviors that must remain unchanged after the fix
- **`handleAddNew()`**: The function in `apps/web/src/app/workers/page.tsx` that sets `isSheetOpen = true` and `selectedWorker = null`
- **`isSheetOpen`**: React state controlling whether the Add Worker `<Sheet>` is open
- **`roleLoading`**: Boolean from `useUserRole()` indicating whether the user's role/profile data is still being fetched
- **`workerProfile`**: The resolved worker profile object from `useUserRole()`, `undefined` while loading
- **`isSuperAdmin`**: Boolean from `useUserRole()` indicating super admin status

---

## Bug Details

### Bug 1: Add Worker Sheet Empty

#### Bug Condition

The bug manifests when a user with `canManageWorkers` permission clicks "Add Worker". The `handleAddNew()` function correctly sets `isSheetOpen = true`, but the `<Sheet>` component's `<SheetContent>` in the JSX contains no child elements — the worker creation form was never added to it.

**Formal Specification:**
```
FUNCTION isBugCondition_Bug1(input)
  INPUT: input of type UserAction
  OUTPUT: boolean

  RETURN input.action = "click Add Worker button"
         AND canManageWorkers = true
         AND SheetContent has no child JSX elements
END FUNCTION
```

#### Examples

- User clicks "Add Worker" → Sheet panel slides open → panel body is completely blank (expected: worker creation form with fields)
- `isSheetOpen` becomes `true` → `<Sheet open={true}>` renders → `<SheetContent>` renders with no children → user sees empty white panel
- Inspecting the DOM: `SheetContent` div exists but is empty

---

### Bug 2: Room Reservation Always Shows "Profile Not Found"

#### Bug Condition

The bug manifests on the initial render of `/reservations/new`. The `useUserRole()` hook is asynchronous — on first render `roleLoading = true` and `workerProfile = undefined`. In the original code, the `!workerProfile && !isSuperAdmin` guard was evaluated before the `roleLoading` guard, so the page immediately renders the error screen before the hook resolves.

**Formal Specification:**
```
FUNCTION isBugCondition_Bug2(input)
  INPUT: input of type PageRenderState
  OUTPUT: boolean

  RETURN input.roleLoading = true
         AND input.workerProfile = undefined
         AND renderOrder(workerProfileCheck) < renderOrder(roleLoadingCheck)
END FUNCTION
```

#### Examples

- Authenticated worker navigates to `/reservations/new` → `roleLoading = true`, `workerProfile = undefined` → `!workerProfile && !isSuperAdmin` evaluates to `true` → "Worker Profile Not Found" shown (expected: loading spinner)
- Super admin navigates to `/reservations/new` → same race condition → error shown before `isSuperAdmin` resolves to `true`
- After hook resolves: `roleLoading = false`, `workerProfile = { id: "...", ... }` → but page already rendered error, no re-evaluation occurs in the wrong order

---

## Expected Behavior

### Preservation Requirements

**Bug 1 — Unchanged Behaviors:**
- The Import sheet (`isImportSheetOpen`) must continue to open correctly via the Import button
- Edit action on existing workers must continue to navigate to `/workers/{id}/edit`
- Batch move, batch delete, and batch meal stub operations must continue to work correctly
- The `<Sheet>` component's `open`/`onOpenChange` wiring must remain unchanged

**Bug 2 — Unchanged Behaviors:**
- Successful room reservation submission must continue to validate capacity, check conflicts, and create approval records
- Room selection with facility elements must continue to display available elements
- The "Worker Profile Not Found" error screen must still appear for users who genuinely have no worker profile (after loading completes)
- Super admin access to the form must continue to work
- All post-submission flows (`/reservations/my`, `/reservations/calendar`) must remain unaffected

**Scope:**
All inputs that do NOT trigger the specific bug conditions above should be completely unaffected by these fixes. This includes all other buttons, form interactions, navigation, and data fetching behavior.

---

## Hypothesized Root Cause

### Bug 1

1. **Missing Form JSX in SheetContent**: The `<Sheet open={isSheetOpen}>` block was added to the page with an empty `<SheetContent>`. The worker creation form (fields for name, email, phone, role, ministry, status, etc.) was never placed inside it. The state management (`isSheetOpen`, `selectedWorker`) is correct — only the rendered content is missing.

2. **No Separate Form Component Imported**: Unlike `ImportSheet`, `BatchMinistrySheet`, and `BatchMealStubSheet` which are imported from `@/components/workers/`, there is no corresponding `WorkerFormSheet` or `AddWorkerSheet` component imported or rendered.

### Bug 2

1. **Guard Order Inversion**: The original render sequence evaluated `!workerProfile && !isSuperAdmin` before `roleLoading`. Since React hooks are asynchronous, `workerProfile` is `undefined` and `isSuperAdmin` is `false` on the very first render tick, causing the error branch to be taken immediately.

2. **No Loading State Shown**: Because the `roleLoading` check came after the profile check, the loading spinner was never reached on first render — the error screen preempted it.

---

## Correctness Properties

Property 1: Bug Condition - Add Worker Sheet Renders Form Content

_For any_ user action where `canManageWorkers` is true and the "Add Worker" button is clicked (isBugCondition_Bug1 returns true), the fixed page SHALL render a worker creation form inside `<SheetContent>` with input fields for worker data entry.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Add Worker Sheet Does Not Break Other Sheets

_For any_ user action that does NOT involve clicking "Add Worker" (isBugCondition_Bug1 returns false), the fixed page SHALL produce exactly the same behavior as the original page, preserving Import sheet, batch operations, and edit navigation.

**Validates: Requirements 3.1, 3.2, 3.3**

Property 3: Bug Condition - Room Reservation Shows Spinner While Loading

_For any_ page render state where `roleLoading` is true (isBugCondition_Bug2 returns true), the fixed page SHALL render the loading spinner and SHALL NOT render the "Worker Profile Not Found" error screen.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 4: Preservation - Room Reservation Error Screen Still Shown When Appropriate

_For any_ page render state where `roleLoading` is false AND `workerProfile` is null AND `isSuperAdmin` is false (isBugCondition_Bug2 returns false), the fixed page SHALL produce the same "Worker Profile Not Found" error screen as the original, preserving the access control behavior.

**Validates: Requirements 2.4, 3.1, 3.2, 3.3, 3.4**

---

## Fix Implementation

### Bug 1: Add Worker Sheet

**File**: `apps/web/src/app/workers/page.tsx`

**Location**: The `<Sheet open={isSheetOpen}>` block near the bottom of the JSX return (after the main table, before the Import sheet)

**Specific Changes**:

1. **Add Worker Form Inside SheetContent**: Populate the empty `<SheetContent>` with a worker creation/edit form. The form should include:
   - `SheetHeader` with title ("Add Worker" or "Edit Worker" based on `selectedWorker`)
   - Fields: First Name, Last Name, Email, Phone, Worker ID, Role (Select), Status (Select), Major Ministry (Select), Minor Ministry (Select), Employment Type (Select)
   - Submit button wired to `createWorkerSql` (when `selectedWorker` is null) or `updateWorkerSql` (when editing)
   - Cancel/close button that calls `setIsSheetOpen(false)`

2. **Form State**: Add local form state variables inside the component (or a sub-component) for the new worker fields, reset when `selectedWorker` changes.

3. **Save Handler**: Wire the form submission to call `createWorkerSql` with the form data, show a success toast, and close the sheet.

The existing `handleAddNew()` function, `isSheetOpen` state, and `<Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>` wrapper require no changes.

---

### Bug 2: Room Reservation Guard Order

**File**: `apps/web/src/app/reservations/new/page.tsx`

**Function**: Component render return sequence

**Specific Changes**:

1. **Move `roleLoading` check before `!workerProfile` check**: Reorder the early-return guards so that:
   ```
   if (isSubmitted)   → success screen   [unchanged, stays first]
   if (roleLoading)   → spinner          [MOVE THIS BEFORE profile check]
   if (!workerProfile && !isSuperAdmin) → error screen  [stays last]
   ```

2. **No other changes required**: The `roleLoading` guard block and the `!workerProfile` guard block already exist with correct content — only their order needs to be swapped.

---

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate each bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis.

**Bug 1 Test Plan**: Render the workers page with `canManageWorkers = true`, simulate a click on "Add Worker", and assert that the Sheet contains form elements.

**Bug 1 Test Cases**:
1. **Sheet Opens on Click**: Click "Add Worker" → assert `isSheetOpen = true` (will pass even on unfixed code — state is set correctly)
2. **Sheet Contains Form**: Click "Add Worker" → assert `SheetContent` contains at least one `<input>` or form field (will FAIL on unfixed code — SheetContent is empty)
3. **Form Has Required Fields**: Assert presence of name, email, role fields inside the sheet (will FAIL on unfixed code)

**Bug 2 Test Plan**: Render the reservations page with `roleLoading = true` and `workerProfile = undefined`, and assert the loading spinner is shown (not the error screen).

**Bug 2 Test Cases**:
1. **Loading State Shows Spinner**: Render with `roleLoading = true`, `workerProfile = undefined` → assert spinner is rendered (will FAIL on unfixed code — error screen shown instead)
2. **Loading State Hides Error**: Render with `roleLoading = true` → assert "Worker Profile Not Found" text is NOT present (will FAIL on unfixed code)
3. **Resolved State Shows Form**: Render with `roleLoading = false`, `workerProfile = { id: "..." }` → assert form is rendered (will pass on unfixed code if loading ever resolves, but race condition means it may not)

**Expected Counterexamples**:
- Bug 1: `SheetContent` renders with zero child elements when `isSheetOpen = true`
- Bug 2: "Worker Profile Not Found" error renders when `roleLoading = true`

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed code produces the expected behavior.

**Bug 1 Pseudocode:**
```
FOR ALL state WHERE isBugCondition_Bug1(state) DO
  result := render WorkersPage with state
  ASSERT SheetContent contains worker form fields
  ASSERT form fields are empty (new worker mode)
END FOR
```

**Bug 2 Pseudocode:**
```
FOR ALL state WHERE isBugCondition_Bug2(state) DO
  result := render NewReservationPage with state
  ASSERT spinner is rendered
  ASSERT "Worker Profile Not Found" is NOT rendered
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed code produces the same result as the original.

**Pseudocode:**
```
FOR ALL state WHERE NOT isBugCondition(state) DO
  ASSERT original_render(state) = fixed_render(state)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because it generates many input combinations automatically and catches edge cases that manual tests miss.

**Bug 1 Preservation Test Cases**:
1. **Import Sheet Preservation**: Click "Import" → assert `ImportSheet` renders inside its `SheetContent` (unchanged)
2. **Edit Navigation Preservation**: Click "Edit" on a worker → assert `router.push` called with correct path (unchanged)
3. **Batch Operations Preservation**: Select workers and click batch actions → assert batch sheets open correctly (unchanged)

**Bug 2 Preservation Test Cases**:
1. **Error Screen Still Shown**: Render with `roleLoading = false`, `workerProfile = null`, `isSuperAdmin = false` → assert error screen renders (unchanged)
2. **Super Admin Access**: Render with `roleLoading = false`, `workerProfile = null`, `isSuperAdmin = true` → assert form renders (unchanged)
3. **Form Submission Preservation**: Submit a valid reservation → assert booking and approval are created (unchanged)
4. **Conflict Detection Preservation**: Submit with a conflicting time slot → assert conflict toast appears (unchanged)

### Unit Tests

- Test that `handleAddNew()` sets `isSheetOpen = true` and `selectedWorker = null`
- Test that the Sheet renders form fields when `isSheetOpen = true` after the fix
- Test that the reservations page renders the spinner when `roleLoading = true`
- Test that the reservations page renders the error screen when `roleLoading = false` and no profile exists
- Test that the reservations page renders the form when `roleLoading = false` and a valid profile exists

### Property-Based Tests

- Generate random `roleLoading` / `workerProfile` / `isSuperAdmin` combinations and verify the correct screen is shown for each combination
- Generate random worker form inputs and verify the form submission calls `createWorkerSql` with the correct data
- Generate random non-Add-Worker interactions on the workers page and verify behavior is unchanged

### Integration Tests

- Full flow: navigate to `/workers`, click "Add Worker", fill form, submit → verify worker appears in list
- Full flow: navigate to `/reservations/new` as an authenticated worker → verify form loads without error
- Full flow: navigate to `/reservations/new` as a user with no worker profile → verify error screen appears after loading
