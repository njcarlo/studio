# COG App — Gap-Closure Roadmap Progress

Tracks status against `precious-popping-treehouse` roadmap (Layers 1-6, Phases 1-5).
Checkboxes reflect what has actually shipped to the live DB / codebase, not just designed.

## Platform Layers

- [x] **Layer 1 — RBAC restructure** (single role + `Worker.flags[]`, `subMinistryId`, `institutionFlag`)
- [x] **Layer 2 — Generic Approval Workflow engine** (`approval-engine.ts`; Room Booking 3-stage + Major Event parallel-then-sequential migrated)
- [x] **Layer 3 — Notification system** (`InAppNotification` centre + bell UI, `NotificationPreference`, `notification-center.ts#notify()` with email fan-out via `EmailService`)
- [x] **Layer 4 — Generic Audit Log** (`TransactionLog` extended with before/after/reason; `writeAudit()` helper)
- [x] **Layer 5 — Scheduled jobs (cron)** (`/api/cron/daily-jobs`, Vercel Cron + `CRON_SECRET`: void stale meal stubs, no-show sweep, unconfirmed-assignment reminders — each idempotent + audit-logged)
- [x] **Layer 6 — Reporting ledger** (`MealStubLedger` append-only table + cap aggregation; report views not yet built)

## Feature Phases

### Phase 1 — Volunteer-facing core loop
- [x] Sunday attendance confirmation (5.7)
- [x] Slot Type taxonomy + per-slot stub rules (5.3.2, 5.4.1, 5.4.3)
- [x] Meal stub weekly cap & allocation (5.4.2)
- [x] Emergency reassignment (5.3.5)
- [x] Major/Minor ministry assignment approval (5.2.5)
- [x] Availability (5.2.2)

### Phase 2 — Room Reservation completion + Major Event Request
- [x] Room Reservation 3-stage flow (5.8.2)
- [x] Room Display Monitor realtime completion (5.8.3)
- [x] Major Event Request module (5.11) — worker-facing form, parallel-then-sequential approval, catalogue + enable toggle

### Phase 3 — HR & Time Tracking + Training Management
- [x] Training Management open decision resolved: Ministry Head/Dept Head/Sys Admin manage records, all workers view own, no scheduling-block in v1
- [x] **3.2 — Master schedule + late flagging** (5.10.1, 5.10.3)
  - [x] Prisma schema: `MasterSchedule`, `MasterScheduleOverride`, `AttendanceSetting`, `AttendanceRecord.isLate/lateMinutes`
  - [x] Migration SQL (Prisma DDL + RLS lockdown) — applied to live DB
  - [x] Shared types (`packages/types`)
  - [x] Permission registry + `canManageMasterSchedule` flag wired (store → syncer → hook)
  - [x] `services/master-schedule.ts` service layer
  - [x] Server actions in `actions/db.ts`
  - [x] HR-facing UI at `/settings/attendance` (shift editor, grace period, incomplete time-out resolution)
  - [x] Migrations applied to live DB + `prisma generate`
  - [x] End-to-end verification (effective schedule, overrides, late flagging, incomplete time-outs)
- [x] **3.1 — FT/OC weekly weekday meal stub allocation** (5.4.4, 5.5.3) — lazy allocation
  on Clock In (issues an `Issued` `Weekday` MealStub for the day unless it's a day off per
  `MasterSchedule`/`MasterScheduleOverride`, or already issued). Avoids needing the Monday/Sunday
  cron jobs from the original design; auto-voiding unused stubs deferred to Layer 5.
- [x] **3.3 — Leave & Request filing + 4-stage approval + balances** (5.10.4-5.10.6)
  - [x] Prisma schema: `LeaveRequest`, `LeaveBalance`
  - [x] Migration SQL (Prisma DDL + RLS lockdown) — applied to live DB
  - [x] `services/leave-workflow.ts` — built on the approval engine (Ministry Head → HR flag →
    Admin Dept Head); Vacation/Sick/Emergency consume `LeaveBalance` (applied on HR-stage approval,
    reverted on later rejection); ChangeTime/ChangeDayOff write a `MasterScheduleOverride` on final
    approval; blocks filing when balance is insufficient; Full-Time only
  - [x] Server actions in `actions/leave.ts` (worker-facing filing/balances/history + HR balance management)
  - [x] Worker-facing UI at `/leave` (balances, request history, new request dialog)
  - [x] Leave requests surfaced in `/approvals` via `getLeaveApprovals`
  - [x] Migrations applied to live DB + `prisma generate`
  - [x] End-to-end verification (balance block, full approval → balance increment, rejection
    reversion, ChangeTime/ChangeDayOff → `MasterScheduleOverride`, FT-only enforcement)
- [x] **3.4 — Training Management** (5.9) — record-only in v1, no scheduler blocking
  - [x] Prisma schema: `TrainingRecord` (workerId, name, dateCompleted, expiryDate, status, notes, recordedBy)
  - [x] Migration SQL (Prisma DDL + RLS lockdown) — applied to live DB
  - [x] Shared types (`packages/types`)
  - [x] Permission registry + `canManageTraining` flag wired (store → syncer → hook)
  - [x] `services/training.ts` — `canManageTrainingFor`/`getManageableWorkers` cover Ministry
    Head/Approver, Department Head (`DepartmentSetting.headId`), and Sys Admin/`training:manage`
  - [x] Server actions in `actions/training.ts` (self-view + scoped manage CRUD, audit-logged)
  - [x] UI at `/training` — "My Training Records" for every worker, plus a manager section
    (worker picker → per-worker record table with add/edit/delete) shown when in scope
  - [x] Nav entry added
  - [x] Migrations applied to live DB + `prisma generate`
  - [x] End-to-end verification (Ministry Head manage-in-scope, outsider denied, plain worker
    denied self-manage, Sys Admin manage-all, full CRUD lifecycle)

### Phase 4 — C2S completion, Mobile app, Offline
- [x] **C2S gaps (5.12)** — mentor-facing "My Group" tab (location/meeting schedule/current
  module editing, mentee roster, per-session attendance), anonymous public join-request page
  (`/public/c2s-join`) routed through the approval engine to the group's mentor with email
  decision notifications for requesters with no Worker record
  - [x] Prisma schema: `C2SGroup` profile fields + `C2SJoinRequest`, `C2SSession`, `C2SAttendanceRecord`
  - [x] Migration SQL (Prisma DDL + RLS) — applied to live DB
  - [x] Shared types (`packages/types`)
  - [x] Approval engine: anonymous-requester email fallback via `workflow.metadata`
  - [x] `services/c2s.ts` + `actions/c2s.ts`
  - [x] Wired into `decideApprovalStage` + `/approvals` via `getC2SJoinRequestApprovals`
  - [x] UI: `/c2s` "My Group" tab + public join page `/public/c2s-join`
  - [x] End-to-end verification (join request -> mentor approval -> C2SMentee created,
    profile edit, session attendance recording)
- [ ] Mobile app (6.1)
- [ ] Offline support (6.4)

### Phase 5
- [x] **Attendee-facing public module (5.13)**
  - [x] Sermons catalogue: `Sermon` model, `/sermons` admin (CRUD + public toggle),
    `/public/sermons` listing
  - [x] Public service schedule directory: `/public/services` (lists published
    `ServiceSchedule`s via existing `getPublicSchedules()`, links to `/public/schedule/[token]`)
  - [x] Public C2S directory (`/public/c2s-join`, done in 5.12)
  - [x] Event sign-ups: `ChurchEvent.isPublic` + `EventSignup` model, "Make Public" toggle
    and Sign-ups tab on `/events/[id]`, `/public/events` listing + sign-up form
  - [x] Prayer/counselling requests: `PrayerRequest` model, `/public/prayer-requests` form
    (with pastoral-team notification), `/pastoral` admin inbox
  - [x] Permissions: `content:manage`, `pastoral:manage` wired through registry/store/syncer/nav
  - [x] Migration SQL (Prisma DDL + RLS) — applied to live DB; `seedPermissions()` run

## Side Tasks
- [x] In schedules, show feedback when assigning or clicking workers in the assign worker view
- [x] When applying a schedule template, amend the current schedule instead of replacing it (so multiple templates can be applied to the same ministry), and show a confirmation feedback after adding the template
- [x] Month-view calendar for schedules: reusable `MonthCalendar` component
  (`apps/web/src/components/schedule/month-calendar.tsx`, now supports `href`-based entries);
  List/Month tabs added to `/schedule`; worker-facing "Published Schedules"
  portal at `/worker/schedule/published` (logged-in workers browse all `Published`
  schedules by month, click through to the read-only `/schedule/[id]` view)
- [x] `/public/services` redesigned as a Day/Week/Month schedule portal (anonymous,
  top-navbar layout instead of sidenav, "Log in" button): `ScheduleMatrixPortal`
  renders a per-ministry Role×(Date/SlotType) matrix matching the church's existing
  spreadsheet template; CSV export available to logged-in users via `useAuthStore`.
  Backend: `getPublicSchedulesWithAssignments()` (service + action) added since the
  prior `getPublicSchedules()` only returned title/date/token. Superseded the earlier
  `PublicServicesView` List/Month-tabs component.
- [x] Worker-facing schedule routes consolidated under `/worker/schedule`:
  `/my-schedule` → `/worker/schedule`, `/my-schedule/published` → `/worker/schedule/published`,
  `/public/schedule/[token]` → `/worker/schedule/[token]`; old paths now redirect to the new
  ones. `middleware.ts` carries a dedicated regex exception so the token view stays
  reachable without login despite living under the otherwise-authenticated `/worker/*` prefix.
  Nav updated with "My Assignments" / "Published Schedules" sub-items under My Schedule
