# COG App — User Stories

This is the full user-story catalogue for the app as built. It covers every
module and role, including Phase 5 (the attendee-facing public module).

`PLATFORM_ARCHITECTURE.md` §11 already documents a detailed set of Phases
1-4 stories (Volunteer V1-V7, Ministry Scheduler MS1-MS3, Ministry Head
MH1-MH4, Department Head DH1-DH3, Room Reservation Manager RRM1-RRM2, HR
HR1-HR4, Mentor MT1-MT3, System Administrator SA1-SA5, Kiosk K1-K3), each
tagged with a layer/phase reference. Rather than duplicate those, this doc:

- **Part A** gives a per-module story list covering the *whole* app (so every
  feature area has a story, including modules §11 doesn't cover: Inventory,
  Meals, Reports, Training, Reservations, Attendance, Major Events, and the
  new Phase 5 public module).
- **Part B** gives a per-role end-to-end journey, referencing
  `PLATFORM_ARCHITECTURE.md §11 (IDs)` where a story is already documented
  there, and adding new stories for anything introduced after Phase 4
  (Training, Sermons/Content, Pastoral, Public module) or not previously
  covered by role (Inventory Officer, Content Manager, Pastoral Care Team,
  Attendee/Public).

For *where* each story's logic lives in the codebase, see
[`architecture.md`](./architecture.md) §3 (file map) and §5 (recent changes).

---

## Part A — Stories by module

### Authentication & Profile
- As a **worker**, I want to log in with my church-issued credentials, so that
  I can access the parts of the app my role permits.
- As a **worker**, I want to update my password and view my profile, so that
  I can manage my account.
- As a **worker**, I want to view my personal QR code (`/workers/my-qr`), so
  that kiosks can scan me in for attendance/meal stubs.

### Dashboard & My Schedule
- As a **worker**, I want a dashboard summarizing my upcoming duties and
  notifications, so that I know what's expected of me at a glance.
- As a **worker**, I want to see my own upcoming Sunday service assignments
  on `/my-schedule`, so that I know when and where I'm serving.
- As a **worker**, I want to confirm attendance for an assignment or request
  reassignment if I can't make it, so that ministry leads know my
  availability ahead of time.

### Service Schedule (Sunday Service Scheduling)
- As a **Ministry Scheduler**, I want to build a Sunday service schedule by
  assigning workers to slots within my ministry, so that every role is
  covered.
- As a **Ministry Scheduler**, I want feedback when I assign or click a
  worker in the assign-worker view, so that I know the action registered
  (Side Task, shipped this session).
- As a **Ministry Scheduler**, I want to save and reuse schedule templates,
  and apply a template to *amend* (not replace) the current schedule, so
  multiple templates can build up one week's schedule with a confirmation
  after each apply (Side Task, shipped this session).
- As a **Ministry Head/Master Scheduler**, I want to view and manage
  schedules across all ministries (`schedule:view_all`), so that I can spot
  gaps or conflicts church-wide.
- As a **Sys Admin**, I want to assign the Ministry Scheduler capability to
  specific workers per ministry, so that scheduling responsibility is
  delegated without granting full admin rights.
- As a **worker**, I want to self-service my availability (5.2.2), so that
  schedulers know when I can/can't be assigned.
- As a **Ministry Head**, I want a Minor Ministry assignment approval
  workflow (5.2.5), so that minor-ministry assignments go through a
  lightweight review before being finalized.
- As a **Ministry Head/Scheduler**, I want emergency reassignment for "Not
  Attending" assignments (5.3.5), so a slot doesn't go uncovered when someone
  drops out close to service time.

### Room Reservations & Master Schedule
- As a **worker**, I want to request a room reservation for an event or
  meeting, so that I can secure a space.
- As a **Ministry Head → Department Head → Room Reservation Manager**, I
  want a 3-stage approval flow for room reservations (5.8.2), so that space
  conflicts and resourcing are checked before approval.
- As a **Room Reservation Manager / scheduler**, I want a master schedule
  calendar (`/reservations/masterview`, daily view) showing all approved
  bookings, so I can see room utilization at a glance.
- As any **worker with a pending/approved reservation**, I want to see "My
  Reservations" and the full approved calendar, so I can track my bookings.
- As a **Room Display Monitor / kiosk**, I want a realtime room display
  (5.8.3) that updates as bookings change, so that a screen outside a room
  always shows the current/next booking without a refresh.

### Meal Stubs
- As a **volunteer**, I want to view my meal stub status, so I know whether
  I'm entitled to a meal for my service.
- As an **FT/OC worker**, I want a weekday meal stub to be automatically
  issued when I clock in (3.1, lazy allocation), unless it's a day off per my
  master schedule, so I don't have to request it manually.
- As a **Meal Stub Assigner**, I want to assign/manage meal stubs for a given
  Sunday (weekly cap & allocation, 5.4.2), so meals are distributed fairly
  within budget.
- As a **kiosk operator**, I want a meal stub scanner (`/mealstub/scanner`,
  `attendance:scan_meal`) that marks a stub as redeemed on scan, so meal
  distribution is tracked without manual lists.
- As a **Sys Admin**, I want a `MealStubLedger` (Layer 6) recording every
  issuance/redemption, so totals can be reconciled and capped per
  ministry/week.

### Approvals (cross-cutting)
- As any **approver** (Ministry Head, Department Head, Room Reservation
  Manager, HR, Admin Dept Head, Mentor), I want a single `/approvals` inbox
  showing every pending request that needs my decision — room reservations,
  major events, leave requests, minor-ministry assignments, C2S join
  requests — so I don't have to check multiple pages.
- As a **Sys Admin** with `approvals:approve_all`, I want to act as a
  super-approver across all workflow types, so escalations or coverage gaps
  can always be resolved.

### Workers & Ministries
- As a **Sys Admin / HR**, I want a worker directory (`/workers`) with
  create/edit/delete, so I can manage the full roster.
- As a **Sys Admin / HR**, I want to change a worker's Employment Type
  (Full-Time / On-call / Volunteer) (`worker_type:change`), so payroll/meal
  rules apply correctly.
- As a **Sys Admin**, I want to manage ministries/departments
  (`/ministries`, `/settings/departments`), including assigning a
  Department Head, so the org structure stays accurate.

### Attendance
- As a **worker**, I want to confirm my own Sunday attendance
  (`attendance:confirm_sunday`, 5.7), so leadership knows who showed up
  without a manual headcount.
- As a **kiosk operator (HR)**, I want a weekday time-in/out scanner
  (`attendance:scan_weekday`), so FT/OC attendance is logged automatically,
  including late-flagging against the `MasterSchedule`/grace period.
- As an **HR user**, I want to resolve late-arrival and incomplete time-out
  flags (`hr_attendance:resolve_flags`), so attendance records stay accurate.
- As an **HR user**, I want to manage each worker's master schedule (shift
  times, days off, overrides) at `/settings/attendance` (3.2), so attendance
  rules reflect each person's actual working pattern.

### Leave & Requests
- As a **Full-Time worker**, I want to file Leave/Change-Time/Change-Day-Off
  requests and see my leave balances and history (`/leave`, 3.3), so I can
  plan time off and track entitlements.
- As a **Ministry Head → HR → Admin Dept Head**, I want a 4-stage approval
  for leave requests, with `LeaveBalance` automatically decremented on
  HR-stage approval (and reverted on later rejection), so balances stay
  correct without manual bookkeeping.
- As an **HR user**, I want ChangeTime/ChangeDayOff requests to write a
  `MasterScheduleOverride` on final approval, so the attendance system
  immediately reflects the new schedule.

### Training
- As any **worker**, I want to view my own training records (`/training`),
  so I can see what certifications/training I've completed and what's
  expiring.
- As a **Ministry Head / Department Head / Sys Admin**, I want to manage
  training records for workers in my scope (add/edit/delete, with audit
  logging), so compliance records stay current — training is record-only in
  v1, with no scheduling block.

### Connect 2 Souls (C2S)
- As a **Mentor**, I want a "My Group" tab (`/c2s`) to edit my group's
  location, meeting schedule, and current module, view my mentee roster, and
  record per-session attendance (5.12), so I can run my discipleship group
  without needing admin help.
- As a **prospective member**, I want to submit a public join request
  (`/public/c2s-join`) without an account, so I can request to join a C2S
  group even if I'm not yet a registered worker.
- As a **Mentor**, I want C2S join requests routed to me via the approval
  engine and `/approvals`, with the requester notified by email on
  decision (even if they have no Worker record), so anonymous join requests
  are handled the same way as internal approvals.

### Events & Major Events
- As an **event organizer/Ministry Head**, I want to create and manage church
  events (`/events`), with approval for new event requests
  (`events:approve`).
- As a **Sys Admin / Department Head**, I want a Major Event Request module
  (`/major-events`, 5.11) with a catalogue of services, an enable/disable
  toggle, and a parallel-then-sequential approval flow ending with the Admin
  Department Head, so large events get cross-functional sign-off.
- As a **content manager**, I want to mark a `ChurchEvent` as public
  (`isPublic` toggle, gated by `content:manage`) and see a list of attendee
  sign-ups on the event's detail page (Phase 5), so I know who's coming.

### Inventory
- As an **Inventory Officer** (`inventory:manage`), I want to create, edit,
  and delete inventory items and manage stock levels, and optionally set
  custom inventory codes (`inventory:set_code`), in the standalone Inventory
  app (linked from the main nav, `canAccessInventory`).
- As a **worker with inventory access**, I want to view/use the Inventory
  app without full management rights, so I can check stock without risking
  changes.

### Venue Assistance
- As a **ministry member**, I want to request venue assistance (setup,
  equipment, etc.) for an event, scoped to my own ministry
  (`venue_assistance:manage_own_ministry`).
- As a **Venue Command Center operator** (`venue_assistance:manage`), I want
  a command-center view (`/venue/command-center`) of all assistance requests,
  so I can dispatch and track fulfillment.
- As the **system**, I want a cron job (`/api/cron/venue-assistance`) to send
  reminder notifications for upcoming venue assistance needs, so requests
  aren't missed.

### Reports & Audit
- As a **Sys Admin / leadership**, I want a Reports page (`reports:view`)
  summarizing key metrics (attendance, meal stubs, schedules), so I can
  review ministry health without querying the DB directly.
- As a **Sys Admin**, I want a full transaction/audit log
  (`/settings/transaction-logs`, `system:view_audit_logs`) recording
  before/after state and reason for sensitive changes (Layer 4), so any
  change can be traced.

### ORS Legacy Sync
- As a **Sys Admin** (`system:manage_ors_sync`), I want to sync worker
  records from the legacy ORS system (`/settings/ors-sync`), so historical
  worker data is available in the new app without manual re-entry.

### Roles & Permissions
- As a **Sys Admin** (`roles:*`), I want to create/edit roles, assign
  granular `module:action` permissions, and assign roles to workers
  (`/settings/roles`), so access control matches the org's needs.
- As a **Sys Admin**, I want worker-level flags (Team Leader, Ministry
  Scheduler, Mentor, HR, Room Reservation Manager) layered on top of roles,
  so a single worker can hold multiple scoped capabilities (e.g. a Volunteer
  who is also a C2S Mentor).

### Facilities & Venue Elements
- As a **Facilities Manager** (`facilities:manage`), I want to manage rooms
  (`/settings/rooms`) and venue elements/equipment (`/settings/venue-elements`),
  so the reservation and venue-assistance systems have accurate facility data.

### Notifications
- As any **worker**, I want an in-app notification center (bell icon, Layer
  3) showing decisions on my requests (approvals, leave, C2S, prayer
  requests I'm assigned, etc.), with email fan-out via Resend for important
  events, so I don't have to keep checking each module.
- As a **worker**, I want to manage my notification preferences, so I can
  control which events trigger an email.

### Phase 5 — Attendee-Facing Public Module
- As a **Content Manager** (`content:manage`), I want a sermon catalogue
  admin page (`/sermons`) with create/edit/delete and a public/private
  toggle, so I can curate what appears publicly.
- As a **visitor (no account)**, I want to browse public sermons
  (`/public/sermons`) with title, speaker, date, scripture, description, and
  video/audio links, so I can catch up on past messages.
- As a **visitor**, I want to browse the public service schedule directory
  (`/public/services`), listing published service schedules with links to
  each schedule's public view (`/public/schedule/[token]`), so I know what's
  happening each Sunday.
- As a **Content Manager**, I want to mark a `ChurchEvent` as public and see
  a "Sign-ups" tab with the list of registrants, so I can plan capacity.
- As a **visitor**, I want to browse public upcoming events
  (`/public/events`) and sign up (name, email, phone, guest count, notes)
  without an account, so I can register interest in attending.
- As a **visitor**, I want to submit a prayer or counselling request
  (`/public/prayer-requests`), choosing a type and writing a message, so the
  church's pastoral team can follow up — and have the pastoral team notified
  automatically on submission.
- As a **Pastoral Care team member** (`pastoral:manage`), I want an inbox
  (`/pastoral`) of all prayer/counselling requests with status filter
  (New/In Progress/Resolved), and a detail view to set status, assign myself,
  and add internal notes/response, so requests are tracked to resolution.

---

## Part B — Stories by role (end-to-end journeys)

### Volunteer / general Worker
Core journey already documented in `PLATFORM_ARCHITECTURE.md §11 (V1-V7)`:
login → dashboard → view assigned schedule → confirm/decline Sunday
attendance → receive meal stub → request leave/check balances → view
training records. New in this session:
- Self-service availability so schedulers know when they're free (5.2.2).
- See feedback when a scheduler assigns them to a slot (Side Task).
- As a worker who's also a **C2S mentee**, attend sessions recorded by their
  mentor (5.12).

### Ministry Scheduler
Core journey in `PLATFORM_ARCHITECTURE.md §11 (MS1-MS3)`: build/publish a
Sunday schedule, assign workers to slots, handle emergency reassignment
(5.3.5). New: feedback on assign actions, and amend-not-replace template
application with confirmation (both Side Tasks, this session).

### Ministry Head / Team Leader
Core journey in `PLATFORM_ARCHITECTURE.md §11 (MH1-MH4)`: approve room
reservation stage 1, approve minor-ministry assignments (5.2.5), manage
sub-ministry via `subMinistryId`/`team_leader` flag, view C2S analytics if
also a mentor. New: appears as stage-1 approver in `/approvals` for leave
requests (3.3) and major events (5.11) within their ministry.

### Department Head
Core journey in `PLATFORM_ARCHITECTURE.md §11 (DH1-DH3)`: approve room
reservation stage 2, manage department's workers/ministries
(`/settings/departments`). New: approve training-record scope for their
department's workers (3.4), oversee leave requests routed to HR for
department workers.

### Room Reservation Manager
Core journey in `PLATFORM_ARCHITECTURE.md §11 (RRM1-RRM2)`: final-stage
approval of room reservations, master schedule calendar
(`/reservations/masterview`), room display monitor (5.8.3, realtime).

### HR
Core journey in `PLATFORM_ARCHITECTURE.md §11 (HR1-HR4)`: manage master
schedules and grace period (3.2), resolve late/incomplete-time-out flags,
operate weekday scanner. New this phase set:
- HR-stage approval for leave requests, managing `LeaveBalance` increments
  on approval and reversion on rejection (3.3).
- Weekday meal stub lazy-allocation on clock-in respects the worker's
  master schedule/overrides (3.1).
- Approve final stage of training-record scope where applicable
  (`training:manage`, 3.4).

### Mentor (C2S)
Core journey in `PLATFORM_ARCHITECTURE.md §11 (MT1-MT3)`: manage assigned
group, view mentees, record progress. New (5.12):
- "My Group" tab to self-edit group profile (location, meeting schedule,
  current module).
- Per-session attendance recording for mentees.
- Receive and approve/reject anonymous public join requests via
  `/approvals`, with the requester emailed the decision even with no Worker
  record.

### System Administrator
Core journey in `PLATFORM_ARCHITECTURE.md §11 (SA1-SA5)`: manage roles &
permissions, view audit logs, manage ORS sync, super-approve via
`approvals:approve_all`, manage facilities. New:
- Manage the sermon catalogue and toggle event/public visibility
  (`content:manage`).
- View/manage the pastoral-care inbox (`pastoral:manage`) — Sys Admin gets
  both new Phase 5 permissions automatically via `isSuperAdmin`.
- Seed new permissions via `seedPermissions()` whenever the registry changes.
- Manage Major Event catalogue/toggle (`major_events:manage_catalog`) and
  give final approval (`major_events:approve_final`, 5.11).
- Assign Ministry Scheduler / Room Reservation Manager / HR / Mentor /
  Team Leader flags to workers (`WORKER_FLAGS`).

### Kiosk Operator
Core journey in `PLATFORM_ARCHITECTURE.md §11 (K1-K3)`: operate meal-stub
scanner (`attendance:scan_meal`) and weekday time-in/out scanner
(`attendance:scan_weekday`), each scanning a worker's personal QR code
(`/workers/my-qr`).

### Inventory Officer
Not previously documented:
- Logs into Studio and opens **Inventory** (`/inventory` on Prisma)
  from the main nav under "Inventory", gated by `canAccessInventory`).
- With `inventory:manage`, creates/edits/deletes items, adjusts stock, and
  (with `inventory:set_code`) assigns custom item codes.
- A worker with only `inventory:access` can view but not modify inventory.

### Content Manager (Phase 5, new role/permission)
- Maintains the sermon catalogue at `/sermons` (create/edit/delete, toggle
  public visibility).
- Toggles `ChurchEvent.isPublic` on the event detail page and monitors the
  resulting "Sign-ups" tab.
- Both `/public/sermons` and `/public/events` reflect this manager's
  publishing decisions immediately.
- Granted automatically to any Sys Admin role (`isSuperAdmin`); can also be
  granted standalone via `content:manage`.

### Pastoral Care Team (Phase 5, new role/permission)
- Monitors `/pastoral` for incoming prayer/counselling requests, filterable
  by status.
- Opens a request to read full details (name, email, phone, message, type),
  sets status (New → In Progress → Resolved), assigns themselves, and writes
  internal notes/response.
- Receives an in-app/email notification whenever a new public request is
  submitted (via `notification-center.ts`, following the same pattern as
  venue-assistance notifications).
- Granted automatically to any Sys Admin role; can also be granted standalone
  via `pastoral:manage`.

### Attendee / Public (anonymous, Phase 5 + 4.1)
No login required — this is the "front door" for non-workers:
- Browse sermons (`/public/sermons`) and the service schedule directory
  (`/public/services` → `/public/schedule/[token]`).
- Browse and sign up for upcoming public events (`/public/events`).
- Submit a prayer or counselling request (`/public/prayer-requests`).
- Request to join a C2S group (`/public/c2s-join`, Phase 4.1) — routed to the
  group's mentor via the approval engine, with an email decision even though
  no account exists.
