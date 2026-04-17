# Bugfix Requirements Document

## Introduction

This document addresses two critical bugs in the apps/web application:

1. **Add Worker Button Bug**: The "Add Worker" button in the Worker Management page (`/workers`) does not respond when clicked, preventing administrators from adding new workers to the system.

2. **Reserve a Room Bug**: The room reservation feature (`/reservations/new`) always displays a "Profile Not Found" error, blocking all users from creating room reservations regardless of their authentication status.

Additionally, there is a feature enhancement request to display email and contact number in the worker management interface.

## Bug Analysis

### Bug 1: Add Worker Button Not Responding

#### Current Behavior (Defect)

1.1 WHEN a user with `canManageWorkers` permission clicks the "Add Worker" button on the `/workers` page THEN the system does not respond and no form or sheet opens

1.2 WHEN the `handleAddNew()` function is called THEN the system sets `selectedWorker` to null and `isSheetOpen` to true but the sheet component does not render

#### Expected Behavior (Correct)

2.1 WHEN a user with `canManageWorkers` permission clicks the "Add Worker" button on the `/workers` page THEN the system SHALL open a worker creation form/sheet

2.2 WHEN the `handleAddNew()` function is called THEN the system SHALL display the worker form sheet with empty fields ready for data entry

2.3 WHEN the worker form sheet opens THEN the system SHALL display fields for email and contact number along with other worker information

#### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user clicks the "Import" button THEN the system SHALL CONTINUE TO open the import sheet correctly

3.2 WHEN a user clicks the "Edit" action on an existing worker THEN the system SHALL CONTINUE TO navigate to the edit page correctly

3.3 WHEN a user selects workers and performs batch operations THEN the system SHALL CONTINUE TO execute batch move, delete, and meal stub operations correctly

### Bug 2: Room Reservation Always Shows "Profile Not Found"

#### Current Behavior (Defect)

1.1 WHEN any authenticated user navigates to `/reservations/new` THEN the system displays "Worker Profile Not Found" error message

1.2 WHEN the room reservation page checks for `workerProfile` THEN the system evaluates the condition as false even when a valid worker profile exists

1.3 WHEN a user attempts to reserve a room THEN the system blocks access with the error "We couldn't find your worker record" preventing all reservations

#### Expected Behavior (Correct)

2.1 WHEN an authenticated user with a valid worker profile navigates to `/reservations/new` THEN the system SHALL display the room reservation form

2.2 WHEN the room reservation page checks for `workerProfile` THEN the system SHALL correctly identify authenticated users with valid worker profiles

2.3 WHEN a super admin navigates to `/reservations/new` THEN the system SHALL display the room reservation form even without a worker profile

2.4 WHEN a user without a worker profile navigates to `/reservations/new` THEN the system SHALL display the "Worker Profile Not Found" error message

#### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user successfully submits a room reservation THEN the system SHALL CONTINUE TO validate capacity, check for conflicts, and create approval requests correctly

3.2 WHEN a user selects a room with facility elements THEN the system SHALL CONTINUE TO display available elements for selection correctly

3.3 WHEN a user views their reservations at `/reservations/my` THEN the system SHALL CONTINUE TO display their reservation history correctly

3.4 WHEN a user views the reservation calendar at `/reservations/calendar` THEN the system SHALL CONTINUE TO display all reservations correctly
