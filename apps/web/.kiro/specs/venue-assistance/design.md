# Design Document

## Overview

The Venue Assistance module is a standalone Supabase-backed feature within `apps/web` that coordinates ministry support for room bookings. It follows the same architectural patterns already established in the app: Next.js server actions, Prisma ORM, React Query for client-side data fetching, Zustand for auth state, and Resend for email notifications.

---

## Architecture

```
apps/web/src/
├── app/
│   ├── venue/
│   │   ├── page.tsx                        # Booking creation (one-time + recurring)
│   │   ├── my/page.tsx                     # Requester's own bookings
│   │   ├── calendar/page.tsx               # Calendar view of all bookings
│   │   ├── [bookingId]/page.tsx            # Booking detail + assistance status
│   │   └── command-center/page.tsx         # Admin command center
│   └── settings/
│       └── venue-assistance/page.tsx       # Assistance configuration settings
├── actions/
│   └── venue-assistance.ts                 # All server actions for this module
├── components/
│   └── venue-assistance/
│       ├── booking-form.tsx
│       ├── assistance-request-card.tsx
│       ├── assistance-response-dialog.tsx
│       ├── command-center-table.tsx
│       └── assistance-config-form.tsx
├── hooks/
│   ├── use-venue-bookings.ts
│   └── use-assistance-requests.ts
└── services/
    └── venue-assistance-notifications.ts   # Notification templates for this module
```

---

## Data Model

All new tables are added to the existing Prisma schema and Supabase database.

### New Prisma Models

```prisma
model VenueBooking {
  id                  String              @id @default(cuid())
  requestId           String              @unique
  roomId              String
  room                Room                @relation(fields: [roomId], references: [id])
  workerProfileId     String
  worker              Worker              @relation(fields: [workerProfileId], references: [id])
  title               String
  purpose             String?
  start               DateTime
  end                 DateTime
  status              String              @default("Pending Ministry Approval")
  pax                 Int                 @default(0)
  numTables           Int                 @default(0)
  numChairs           Int                 @default(0)
  guidelinesAccepted  Boolean             @default(false)
  recurringBookingId  String?
  recurringBooking    RecurringBooking?   @relation(fields: [recurringBookingId], references: [id])
  assistanceRequests  AssistanceRequest[]
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt
}

model RecurringBooking {
  id              String          @id @default(cuid())
  roomId          String
  workerProfileId String
  title           String
  purpose         String?
  recurrenceRule  String          // RRULE string e.g. "FREQ=WEEKLY;BYDAY=SU"
  startTime       String          // "HH:MM"
  endTime         String          // "HH:MM"
  startDate       DateTime        // First occurrence
  endDate         DateTime?       // Optional end date for the series
  pax             Int             @default(0)
  status          String          @default("Active") // Active | Cancelled
  occurrences     VenueBooking[]
  createdAt       DateTime        @default(now())
}

model AssistanceConfiguration {
  id          String                    @id @default(cuid())
  roomId      String
  room        Room                      @relation(fields: [roomId], references: [id])
  ministryId  String
  items       AssistanceConfigItem[]
  createdBy   String
  updatedAt   DateTime                  @updatedAt
  createdAt   DateTime                  @default(now())

  @@unique([roomId, ministryId])
}

model AssistanceConfigItem {
  id              String                  @id @default(cuid())
  configId        String
  config          AssistanceConfiguration @relation(fields: [configId], references: [id], onDelete: Cascade)
  name            String
  description     String?
  quantity        Int                     @default(1)
  isRequired      Boolean                 @default(true)
}

model AssistanceRequest {
  id              String                @id @default(cuid())
  bookingId       String
  booking         VenueBooking          @relation(fields: [bookingId], references: [id])
  ministryId      String
  status          String                @default("Pending")
  // Pending | Approved | Partial | Declined | Cancelled | In_Progress | Fulfilled
  explanation     String?
  respondedAt     DateTime?
  respondedBy     String?
  items           AssistanceRequestItem[]
  auditLogs       VenueAuditLog[]
  createdAt       DateTime              @default(now())
  updatedAt       DateTime              @updatedAt
}

model AssistanceRequestItem {
  id          String            @id @default(cuid())
  requestId   String
  request     AssistanceRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  name        String
  description String?
  quantity    Int               @default(1)
  isRequired  Boolean           @default(true)
  status      String            @default("Pending") // Pending | Approved | Declined
  adjustedQty Int?
  adjustedDesc String?
}

model VenueAuditLog {
  id          String             @id @default(cuid())
  requestId   String?
  request     AssistanceRequest? @relation(fields: [requestId], references: [id])
  configId    String?
  action      String             // e.g. "status_changed", "config_created", "checkin_scan"
  actorId     String
  before      Json?
  after       Json?
  triggerSource String?          // "manual" | "qr_scan" | "booking_end" | "sla_cron"
  createdAt   DateTime           @default(now())
}

model VenueAssistanceSetting {
  id        String  @id @default("global")
  slaDays   Int     @default(3)
  updatedBy String?
  updatedAt DateTime @updatedAt
}
```

---

## Key Routes

| Route | Access | Description |
|---|---|---|
| `/venue` | All workers | Create a new booking |
| `/venue/my` | All workers | View own bookings + assistance statuses |
| `/venue/calendar` | All workers | Calendar view of all approved bookings |
| `/venue/[bookingId]` | Requester + admin | Booking detail with per-ministry assistance status |
| `/venue/command-center` | `manage_venue_assistance` | Admin dashboard for all requests |
| `/settings/venue-assistance` | `manage_venue_assistance` or `manage_own_ministry_assistance` | Configure room-ministry assistance items |

---

## Server Actions (`actions/venue-assistance.ts`)

```typescript
// Bookings
createVenueBooking(data)           // Creates booking + generates AssistanceRequests
createRecurringBooking(data)       // Creates RecurringBooking + all occurrences + requests
cancelVenueBooking(bookingId)      // Cancels booking + all pending requests
cancelRecurringOccurrence(bookingId)
cancelRecurringSeries(recurringBookingId)

// Assistance Configuration
upsertAssistanceConfig(roomId, ministryId, items)
deleteAssistanceConfig(configId)
getAssistanceConfigsForRoom(roomId)
getAssistanceConfigsForMinistry(ministryId)  // For ministry self-config

// Assistance Requests
getAssistanceRequestsForBooking(bookingId)
getAssistanceRequestsForMinistry(ministryId) // Ministry head's inbox
respondToAssistanceRequest(requestId, itemStatuses, explanation)
bulkRespondToRecurringRequests(recurringBookingId, ministryId, itemStatuses, explanation)

// Check-in
handleBookingCheckIn(bookingId)    // Called from room display QR scan
fulfillCompletedBookings()         // Called by cron — marks In_Progress → Fulfilled

// Admin
getCommandCenterData(filters)
getAuditLogsForRequest(requestId)
updateVenueAssistanceSetting(slaDays)
```

---

## Assistance Request Generation Flow

When `createVenueBooking` is called:

1. Insert `VenueBooking` record
2. Query `AssistanceConfiguration` where `roomId = booking.roomId`
3. For each config, create one `AssistanceRequest` with status `Pending`
4. For each item in the config, create one `AssistanceRequestItem` with status `Pending`
5. Resolve the `Ministry_Head` via `ministry.headId` → look up worker email
6. Send email + in-app notification to each ministry head
7. Write audit log entries

For recurring bookings, steps 1–7 repeat for each generated occurrence.

---

## Assistance Response & Status Derivation

When `respondToAssistanceRequest` is called:

```
itemStatuses: { itemId: string; status: 'Approved' | 'Declined'; adjustedQty?: number; adjustedDesc?: string }[]
```

Derived request status:
- All items `Approved` → request status = `Approved`
- All items `Declined` → request status = `Declined`
- Mixed → request status = `Partial`

After saving:
- Notify booking requester (always)
- Notify `manage_venue_assistance` users
- If any item `Declined` → include ministry head's explanation in requester notification
- Write audit log

---

## Notification System

Extends the existing `EmailService` (Resend). A new `VenueAssistanceNotificationService` handles all templates.

### In-App Notifications

Stored in a new `Notification` table (or reuse existing if one exists). Displayed in a bell icon in the nav.

```prisma
model InAppNotification {
  id        String   @id @default(cuid())
  userId    String
  title     String
  body      String
  link      String?
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

### Notification Events

| Event | Recipients |
|---|---|
| Booking submitted | Ministry heads for that room |
| Booking approved | Ministry heads (reminder if still Pending) |
| Ministry declines any item | Booking requester |
| Request status changes | Booking requester + `manage_venue_assistance` users |
| SLA exceeded (3 days Pending) | Ministry head + `manage_venue_assistance` users |
| Event 3 days away, not Approved/Partial | Ministry head |
| Booking cancelled | Ministry heads with pending requests |

---

## SLA & Escalation Mechanism

Uses a **Supabase Edge Function** scheduled via `pg_cron` (or a Next.js API route called by an external cron like Vercel Cron Jobs).

**Cron schedule:** Daily at 08:00

**Logic:**
```
1. Fetch all AssistanceRequests where status = 'Pending'
2. For each, check: now - createdAt > slaDays (from VenueAssistanceSetting)
3. If exceeded and no escalation sent yet → send SLA notification, write audit log
4. Fetch all VenueBookings where end < now and status != 'Cancelled'
5. For each, update In_Progress AssistanceRequests → Fulfilled, write audit log
```

A `slaEscalatedAt` field on `AssistanceRequest` prevents duplicate escalation emails.

---

## Check-In Integration

The existing `rooms/display/page.tsx` scans QR codes with format `ROOM_CHECKIN:{bookingId}`.

**Change:** After a successful check-in scan, call `handleBookingCheckIn(bookingId)` server action which:
1. Updates all `Approved` and `Partial` `AssistanceRequest` records for that booking → `In_Progress`
2. Writes audit log with `triggerSource: "qr_scan"`
3. Does NOT touch `Declined` or `Cancelled` requests

The `fulfillCompletedBookings` cron handles the `In_Progress` → `Fulfilled` transition at booking end time.

---

## Permissions

Two new permissions added to the existing permissions system:

| Permission | Scope |
|---|---|
| `manage_venue_assistance` | Full access: all rooms, all ministries, command center, SLA settings |
| `manage_own_ministry_assistance` | Scoped: only rooms where the user's ministry has a config |

Both are added to `packages/store/src/permissions.store.ts` and exposed in `Settings > Roles`.

---

## Recurring Booking Data Model

Uses RRULE strings (RFC 5545) for recurrence rules. The `rrule` npm package handles expansion.

```
RecurringBooking
  └── recurrenceRule: "FREQ=WEEKLY;BYDAY=SU;COUNT=12"
  └── occurrences: VenueBooking[] (one per expanded date)
```

On creation, the server action expands the RRULE up to `endDate` or `COUNT`, creates individual `VenueBooking` records, and generates `AssistanceRequest` sets for each.

**Bulk response:** `bulkRespondToRecurringRequests` applies the same item statuses to all `Pending` requests for a given `(recurringBookingId, ministryId)` pair. Individual overrides are applied per `requestId` and take precedence.

---

## Component Structure

### `BookingForm`
- Fields: title, purpose, room (branch → area → room), date/time, pax, tables, chairs
- Toggle: one-time vs. recurring (shows recurrence rule builder if recurring)
- On submit: shows preview of which ministries will be notified

### `AssistanceRequestCard`
- Used in ministry head's inbox (`/venue/my` filtered to their ministry)
- Shows booking details, item list with status badges
- "Respond" button opens `AssistanceResponseDialog`

### `AssistanceResponseDialog`
- Per-item approve/decline toggles
- Quantity/description adjustment fields
- Optional explanation textarea
- Bulk apply option for recurring bookings

### `CommandCenterTable`
- Grouped by booking, expandable rows showing per-ministry request status
- Color-coded: red = SLA exceeded, amber = event within 3 days, green = all approved
- Filter bar: status, ministry, date range

### `AssistanceConfigForm`
- Room selector (admin sees all; ministry head sees only their rooms)
- Ministry selector (admin sees all; ministry head sees only their own)
- Item list with name, description, quantity, required toggle
- Add/remove items inline
