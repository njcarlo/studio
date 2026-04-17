# Implementation Plan

- [x] 1. Write bug condition exploration tests (BEFORE implementing fixes)
  - **Property 1: Bug Condition** - Add Worker Sheet Empty & Room Reservation Profile Not Found
  - **CRITICAL**: These tests MUST FAIL on unfixed code — failure confirms the bugs exist
  - **DO NOT attempt to fix the tests or the code when they fail**
  - **GOAL**: Surface counterexamples that demonstrate both bugs exist
  - **Bug 1 — Scoped PBT Approach**: Render `WorkersPage` with `canManageWorkers = true`, simulate click on "Add Worker", assert `SheetContent` contains at least one input/form field
    - Expected counterexample: `SheetContent` renders with zero child elements when `isSheetOpen = true`
  - **Bug 2 — Scoped PBT Approach**: Render `NewReservationPage` with `roleLoading = true` and `workerProfile = undefined`, assert loading spinner is shown and "Worker Profile Not Found" text is NOT present
    - Expected counterexample: "Worker Profile Not Found" renders when `roleLoading = true`
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests FAIL (this is correct — it proves the bugs exist)
  - Document counterexamples found to understand root cause
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2 (Bug 1); 1.1, 1.2, 1.3 (Bug 2)_

- [x] 2. Write preservation property tests (BEFORE implementing fixes)
  - **Property 2: Preservation** - Other Sheets/Actions Unaffected & Room Reservation Access Control Preserved
  - **IMPORTANT**: Follow observation-first methodology — observe behavior on UNFIXED code for non-buggy inputs
  - **Bug 1 Preservation — observe on unfixed code**:
    - Observe: clicking "Import" opens `ImportSheet` correctly
    - Observe: clicking "Edit" on a worker calls `router.push` with `/workers/{id}/edit`
    - Observe: batch operations (move, delete, meal stub) open their respective sheets/dialogs
    - Write property-based tests: for all user actions that are NOT "click Add Worker", behavior is unchanged
  - **Bug 2 Preservation — observe on unfixed code**:
    - Observe: `roleLoading = false`, `workerProfile = null`, `isSuperAdmin = false` → error screen renders
    - Observe: `roleLoading = false`, `workerProfile = { id: "..." }` → reservation form renders
    - Observe: `roleLoading = false`, `workerProfile = null`, `isSuperAdmin = true` → reservation form renders
    - Write property-based tests: for all render states where `roleLoading = false`, the correct screen is shown based on profile/admin status
  - Verify tests PASS on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3 (Bug 1); 2.4, 3.1, 3.2, 3.3, 3.4 (Bug 2)_

- [x] 3. Fix Bug 1 — Add Worker Sheet: Populate SheetContent with worker creation form

  - [x] 3.1 Implement the worker creation form inside SheetContent
    - File: `apps/web/src/app/workers/page.tsx`
    - Add local form state variables for: `firstName`, `lastName`, `email`, `phone`, `workerId`, `roleId`, `status`, `majorMinistryId`, `minorMinistryId`, `employmentType`
    - Reset form state when `selectedWorker` changes (useEffect on `selectedWorker`)
    - Inside `<Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>`, populate `<SheetContent>` with:
      - `SheetHeader` with dynamic title ("Add Worker" when `selectedWorker` is null)
      - Input fields: First Name, Last Name, Email, Phone, Worker ID
      - Select fields: Role, Status, Major Ministry, Minor Ministry, Employment Type
      - Submit button wired to `createWorkerSql` (when `selectedWorker` is null)
      - Cancel button calling `setIsSheetOpen(false)`
    - On successful submit: show success toast, close sheet, reset form
    - _Bug_Condition: isBugCondition_Bug1 — `canManageWorkers = true` AND `SheetContent` has no child JSX_
    - _Expected_Behavior: SheetContent renders worker creation form with all required fields_
    - _Preservation: `<Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>` wrapper unchanged; Import sheet, batch operations, and edit navigation unaffected_
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.2 Verify bug condition exploration test now passes (Bug 1)
    - **Property 1: Expected Behavior** - Add Worker Sheet Renders Form Content
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test from task 1 encodes the expected behavior: `SheetContent` contains form fields when `isSheetOpen = true`
    - Run bug condition exploration test from step 1 (Bug 1 portion)
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Verify preservation tests still pass (Bug 1)
    - **Property 2: Preservation** - Other Sheets/Actions Unaffected
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run preservation property tests from step 2 (Bug 1 portion)
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions in Import sheet, Edit navigation, batch operations)

- [x] 4. Fix Bug 2 — Room Reservation: Move roleLoading check before workerProfile check

  - [x] 4.1 Implement the guard order fix
    - File: `apps/web/src/app/reservations/new/page.tsx`
    - Reorder the early-return guards in the component render so the sequence is:
      1. `if (isSubmitted)` → success screen (unchanged, stays first)
      2. `if (roleLoading)` → spinner (MOVE THIS before the profile check)
      3. `if (!workerProfile && !isSuperAdmin)` → error screen (stays last)
    - No other changes required — the content of each guard block is already correct
    - _Bug_Condition: isBugCondition_Bug2 — `roleLoading = true` AND `workerProfile = undefined` AND `renderOrder(workerProfileCheck) < renderOrder(roleLoadingCheck)`_
    - _Expected_Behavior: When `roleLoading = true`, spinner renders and error screen does NOT render_
    - _Preservation: When `roleLoading = false` and no valid profile/admin, error screen still renders; form submission, conflict detection, and all post-submission flows unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 4.2 Verify bug condition exploration test now passes (Bug 2)
    - **Property 1: Expected Behavior** - Room Reservation Shows Spinner While Loading
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test from task 1 encodes the expected behavior: spinner renders when `roleLoading = true`, error screen does NOT render
    - Run bug condition exploration test from step 1 (Bug 2 portion)
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 4.3 Verify preservation tests still pass (Bug 2)
    - **Property 2: Preservation** - Room Reservation Access Control Preserved
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run preservation property tests from step 2 (Bug 2 portion)
    - **EXPECTED OUTCOME**: Tests PASS (confirms error screen still shown for users with no profile, super admin still gets form, form submission and conflict detection unchanged)

- [x] 5. Checkpoint — Ensure all tests pass
  - Re-run the full test suite covering both bugs
  - Confirm Property 1 (Bug Condition) tests pass for both Bug 1 and Bug 2
  - Confirm Property 2 (Preservation) tests pass for both Bug 1 and Bug 2
  - Ensure all tests pass; ask the user if any questions arise
