# Implementation Plan: Venue Assistance

## Overview

Implement the Venue Assistance module as a standalone Supabase-backed feature within `apps/web`. Tasks follow the existing patterns: Prisma schema → server actions → notification service → UI components → cron job.

## Tasks

- [x] 1. Prisma schema additions
  - Add `VenueBooking`, `RecurringBooking`, `AssistanceConfiguration`, `AssistanceConfigItem`, `AssistanceRequest`, `AssistanceRequestItem`, `VenueAuditLog`, `VenueAssistanceSetting`, and `InAppNotification` models to `packages/database/prisma/schema.prisma`
  - Add `slaEscalatedAt DateTime?` field to `AssistanceRequest` model to prevent duplicate SLA escalation emails
  - Add `Room` relation back-references for `VenueBooking` and `AssistanceConfiguration`
  - _Requirements: 1.2, 3.1, 3.3, 7.1, 8.1, 9.1_

- [x] 2. Database migration
  - Run `prisma migrate dev --name venue-assistance` in `packages/database`
  - Seed `VenueAssistanceSetting` with default `{ id: "global", slaDays: 3 }`
  - _Requirements: 7.4_

- [x] 3. Permissions additions
  - Add `canManageVenueAssistance` and `canManageOwnMinistryAssistance` boolean flags to `PermissionsState` interface and `DEFAULT_STATE` in `packages/store/src/permissions.store.ts`
  - Map them from `manage_venue_assistance` and `manage_own_ministry_assistance` permission strings in the existing permissions sync logic
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 4. Server actions — bookings and configuration
  - Create `apps/web/src/actions/venue-assistance.ts` with `"use server"` directive
  - Implement `createVenueBooking(data)`: insert `VenueBooking`, query `AssistanceConfiguration` for the room, create `AssistanceRequest` + `AssistanceRequestItem` records per ministry, write audit log, trigger notifications
  - Implement `createRecurringBooking(data)`: expand RRULE using the `rrule` npm package, create `RecurringBooking` + one `VenueBooking` per occurrence, generate assistance requests for each occurrence
  - Implement `cancelVenueBooking(bookingId)`, `cancelRecurringOccurrence(bookingId)`, `cancelRecurringSeries(recurringBookingId)`: set status to `Cancelled` on booking(s) and all `Pending` assistance requests, notify ministry heads
  - Implement `upsertAssistanceConfig(roomId, ministryId, items)` and `deleteAssistanceConfig(configId)` with permission checks and audit logging
  - Implement `getAssistanceConfigsForRoom(roomId)` and `getAssistanceConfigsForMinistry(ministryId)`
  - _Requirements: 1.2, 1.3, 1.6, 2.1, 2.2, 3.1, 3.3, 3.4, 3.6, 8.1, 10.1, 10.2, 10.3_

- [x] 5. Server actions — assistance responses and admin
  - Implement `getAssistanceRequestsForBooking(bookingId)` and `getAssistanceRequestsForMinistry(ministryId)`
  - Implement `respondToAssistanceRequest(requestId, itemStatuses, explanation)`: update item statuses, derive request status (all Approved → Approved, all Declined → Declined, mixed → Partial), set `respondedAt`/`respondedBy`, notify requester and `manage_venue_assistance` users, write audit log
  - Implement `bulkRespondToRecurringRequests(recurringBookingId, ministryId, itemStatuses, explanation)`: apply same response to all `Pending` requests for the (recurringBookingId, ministryId) pair
  - Implement `handleBookingCheckIn(bookingId)`: update `Approved` and `Partial` requests → `In_Progress`, write audit log with `triggerSource: "qr_scan"`
  - Implement `fulfillCompletedBookings()`: find bookings where `end < now`, update their `In_Progress` requests → `Fulfilled`, write audit log with `triggerSource: "booking_end"`
  - Implement `getCommandCenterData(filters)` with status/ministry/date range filtering
  - Implement `getAuditLogsForRequest(requestId)` and `updateVenueAssistanceSetting(slaDays)`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 6.4, 7.4, 8.2, 9.1, 9.2, 9.3, 9.4, 9.5, 10.4, 10.5_

  - [ ]* 5.1 Write unit tests for `deriveRequestStatus` helper
    - Test: all Approved → `Approved`; all Declined → `Declined`; mixed → `Partial`
    - _Requirements: 5.5_

  - [ ]* 5.2 Write property test for status derivation
    - **Property 1: Status derivation is total and deterministic** — for any non-empty array of item statuses, `deriveRequestStatus` always returns exactly one of `Approved | Partial | Declined` and the same input always produces the same output
    - **Validates: Requirements 5.5**

- [x] 6. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [x] 7. Notification service
  - Create `apps/web/src/services/venue-assistance-notifications.ts` extending the existing `EmailService` pattern
  - Implement email + in-app notification helpers: `notifyMinistryHeadNewRequest`, `notifyMinistryHeadBookingApproved`, `notifyRequesterDecline`, `notifyStatusChange`, `notifySlaEscalation`, `notifyPreEventReminder`, `notifyMinistryHeadCancellation`
  - Each helper writes an `InAppNotification` record and calls `EmailService` with the appropriate template
  - Include direct link to the assistance request detail page in each notification per Requirement 4.2
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 8. SLA cron job
  - Create `apps/web/src/app/api/cron/venue-assistance/route.ts` as a Next.js API route
  - Verify the `Authorization: Bearer` header matches `CRON_SECRET` env var before processing
  - Call `fulfillCompletedBookings()` to handle `In_Progress` → `Fulfilled` transitions
  - Query all `Pending` `AssistanceRequest` records where `createdAt < now - slaDays` and `slaEscalatedAt IS NULL`; for each, call `notifySlaEscalation` and set `slaEscalatedAt = now`
  - Query all `VenueBooking` records where `start` is within 3 days and associated requests are not `Approved` or `Partial`; call `notifyPreEventReminder` for each
  - Register the route in `vercel.json` crons config with schedule `0 8 * * *`
  - _Requirements: 4.4, 4.5, 7.2, 7.3, 7.5, 9.2_

  - [ ]* 8.1 Write unit tests for cron SLA query logic
    - Test that requests exactly at the SLA boundary are included/excluded correctly
    - Test that already-escalated requests (`slaEscalatedAt` set) are skipped
    - _Requirements: 7.2, 7.5_

  - [ ]* 8.2 Write property test for SLA boundary check
    - **Property 2: SLA escalation is idempotent** — running the SLA check multiple times on the same request never sends more than one escalation (slaEscalatedAt guard)
    - **Validates: Requirements 7.5**

- [x] 9. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [x] 10. React Query hooks
  - Create `apps/web/src/hooks/use-venue-bookings.ts` with `useVenueBookings`, `useMyVenueBookings`, and `useVenueBooking(bookingId)` hooks wrapping the server actions
  - Create `apps/web/src/hooks/use-assistance-requests.ts` with `useAssistanceRequestsForBooking`, `useAssistanceRequestsForMinistry`, and `useCommandCenterData` hooks
  - _Requirements: 3.1, 5.1, 6.1_

- [x] 11. Assistance configuration UI
  - Create `apps/web/src/components/venue-assistance/assistance-config-form.tsx`: room selector (admin sees all; ministry head sees only their rooms), ministry selector (admin sees all; ministry head sees only their own), inline item list with name/description/quantity/required toggle, add/remove items
  - Create `apps/web/src/app/settings/venue-assistance/page.tsx`: list existing configs grouped by room, open `AssistanceConfigForm` in a sheet/dialog for create/edit, delete with confirmation, guard with `canManageVenueAssistance || canManageOwnMinistryAssistance`
  - Show error message when a user without permissions attempts to modify a config per Requirement 2.3 and 2.4
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 2.4_

- [x] 12. Booking creation page
  - Create `apps/web/src/components/venue-assistance/booking-form.tsx`: fields for title, purpose, room (branch → area → room cascade), date/time, pax, tables, chairs; toggle for one-time vs. recurring; recurrence rule builder (frequency, day-of-week, end date / count) shown when recurring is selected; preview of which ministries will be notified on submit
  - Create `apps/web/src/app/venue/page.tsx` rendering `BookingForm`, calling `createVenueBooking` or `createRecurringBooking` on submit
  - Create `apps/web/src/app/venue/my/page.tsx` listing the current user's bookings with assistance status badges
  - _Requirements: 3.1, 3.2, 3.5, 3.6, 10.1, 10.2, 10.3_

- [x] 13. Booking detail page
  - Create `apps/web/src/components/venue-assistance/assistance-request-card.tsx`: shows booking details, per-ministry item list with status badges, "Respond" button (visible to ministry head only)
  - Create `apps/web/src/app/venue/[bookingId]/page.tsx`: fetch booking + assistance requests, render one `AssistanceRequestCard` per ministry, show cancel button for requester
  - _Requirements: 5.1, 5.7, 9.1_

- [x] 14. Ministry head response dialog
  - Create `apps/web/src/components/venue-assistance/assistance-response-dialog.tsx`: per-item approve/decline toggles, quantity/description adjustment fields, optional explanation textarea, bulk-apply toggle for recurring bookings (calls `bulkRespondToRecurringRequests` when enabled)
  - Wire "Respond" button in `AssistanceRequestCard` to open this dialog; on submit call `respondToAssistanceRequest` or `bulkRespondToRecurringRequests`
  - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.8, 10.4, 10.5_

  - [ ]* 14.1 Write unit tests for `AssistanceResponseDialog` item status toggling
    - Test that toggling all items to Approved enables submit; test mixed state shows "Partial" preview label
    - _Requirements: 5.3, 5.5_

- [x] 15. Admin command center
  - Create `apps/web/src/components/venue-assistance/command-center-table.tsx`: rows grouped by booking, expandable per-ministry request rows, color coding (red = SLA exceeded, amber = event within 3 days and not Approved/Partial, green = all approved), filter bar for status/ministry/date range
  - Create `apps/web/src/app/venue/command-center/page.tsx`: guard with `canManageVenueAssistance`, render `CommandCenterTable`, show full request detail + audit log on row selection, include SLA settings form calling `updateVenueAssistanceSetting`
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.4, 8.3_

- [x] 16. Check-in integration
  - Update `apps/web/src/app/rooms/display/page.tsx`: after a successful QR scan that resolves a `bookingId`, call `handleBookingCheckIn(bookingId)` server action
  - Ensure `Declined` and `Cancelled` requests are not touched (enforced in the server action)
  - _Requirements: 9.1, 9.3, 9.4_

- [x] 17. Navigation updates
  - Add "Venue" link to the main nav pointing to `/venue`
  - Add "Command Center" sub-link under Venue visible only when `canManageVenueAssistance` is true
  - Add "Venue Assistance" link under Settings visible when `canManageVenueAssistance || canManageOwnMinistryAssistance`
  - _Requirements: 1.1, 6.1_

- [x] 18. Final checkpoint — Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- The `rrule` npm package must be added to `apps/web` for recurring booking expansion
- `slaEscalatedAt` on `AssistanceRequest` is the guard against duplicate SLA emails
- All permission checks in server actions should throw or return an error object — never silently skip
- Property tests validate universal correctness properties; unit tests cover specific examples and edge cases
