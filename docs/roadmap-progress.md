# COG App — Gap-Closure Roadmap Progress

Tracks status against `precious-popping-treehouse` roadmap (Layers 1-6, Phases 1-5).
Checkboxes reflect what has actually shipped to the live DB / codebase, not just designed.

## Platform Layers

- [x] **Layer 1 — RBAC restructure** (single role + `Worker.flags[]`, `subMinistryId`, `institutionFlag`)
- [x] **Layer 2 — Generic Approval Workflow engine** (`approval-engine.ts`; Room Booking 3-stage + Major Event parallel-then-sequential migrated)
- [ ] **Layer 3 — Notification system** (only `InAppNotification` model exists; push/email + outbox drain not built)
- [x] **Layer 4 — Generic Audit Log** (`TransactionLog` extended with before/after/reason; `writeAudit()` helper)
- [ ] **Layer 5 — Scheduled jobs (cron)** (not started; Phase 3.2 deliberately avoids needing this)
- [ ] **Layer 6 — Reporting ledger** (`MealStubLedger` + report views not started)

## Feature Phases

### Phase 1 — Volunteer-facing core loop
- [ ] Sunday attendance confirmation (5.7)
- [ ] Slot Type taxonomy + per-slot stub rules (5.3.2, 5.4.1, 5.4.3)
- [ ] Meal stub weekly cap & allocation (5.4.2)
- [ ] Emergency reassignment (5.3.5)
- [ ] Major/Minor ministry assignment approval (5.2.5)
- [ ] Availability (5.2.2)

### Phase 2 — Room Reservation completion + Major Event Request
- [x] Room Reservation 3-stage flow (5.8.2)
- [ ] Room Display Monitor realtime completion (5.8.3)
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
- [ ] **3.1 — FT/OC weekly weekday meal stub allocation** (5.4.4, 5.5.3)
- [ ] **3.3 — Leave & Request filing + 4-stage approval + balances** (5.10.4-5.10.6)
- [ ] **3.4 — Training Management** (5.9)

### Phase 4 — C2S completion, Mobile app, Offline
- [ ] C2S gaps (5.12)
- [ ] Mobile app (6.1)
- [ ] Offline support (6.4)

### Phase 5 — Deferred
- [ ] Attendee-facing public module (5.13) — intentionally out of v1 scope
