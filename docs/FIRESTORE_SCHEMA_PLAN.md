# Firestore Schema Design — Phase 0 Deliverable

Companion to the Firebase migration plan (branch `firebase-migration`). Source of truth for the current relational shape: `prisma/schema.prisma` (68 models). This doc defines the target Firestore collection design, one section per domain group, matching the groupings used in the migration plan.

**Status:** design draft, not yet implemented. No Firestore writes happen until each domain's Phase 3 cutover. Review before Phase 3 starts on any domain.

**Conventions used throughout:**
- Document IDs default to the existing Prisma `id` (mostly UUID/cuid strings) so backfill scripts can preserve identity across the migration — this keeps foreign-key-shaped `workerId`/`ministryId` style fields valid pointers during dual-write verification.
- "Soft reference" fields (plain string IDs with no Postgres-enforced FK, per the extraction below) carry over as plain string fields in Firestore — Firestore has no enforced-relation concept at all, so this distinction from Postgres disappears; every reference becomes a soft reference.
- "Denormalized" fields are ones a Cloud Function keeps in sync on writes to the source document (fan-out-on-write), to avoid a client-side join Firestore can't do natively.
- Composite indexes required for a collection's known query patterns are listed per collection; these need entries in `firestore.indexes.json` before the corresponding query ships.

---

## 1. Identity / RBAC

`Worker` is the highest fan-out model in the schema (15 enforced incoming relations in Postgres). In Firestore this stays a single top-level `workers/{workerId}` collection — there's no natural subcollection split since the "children" (attendance, bookings, leave, etc.) are each large independent domains with their own query patterns, not a strict 1:N owned by Worker alone.

### `workers/{id}`
Mirrors `Worker` fields directly: `workerId?`, `firstName`, `lastName`, `email` (unique — enforce via a Cloud Function check on create, since Firestore has no native unique-constraint), `phone`, `status`, `avatarUrl`, `majorMinistryId`, `minorMinistryId`, `subMinistryId?`, `flags: string[]`, `institutionFlag`, `employmentType?`, `birthDate?`, `passwordChangeRequired`, `qrToken?`, `isSeniorPastor`, `address?`, `biometricsId?`, `startMonth?`, `startYear?`, `remarks?`, `legacyMigratedAt?`, `legacyMigratedFrom?`, `capabilities: string[]`, `createdAt`, `updatedAt`.
- **New field:** `roleId?` stays a plain reference to `roles/{roleId}` (Firestore has no join, so reads that need the role name must either denormalize `roleName` onto `workers` via Cloud Function, or do a second read — recommend denormalizing `roleName` given how often Worker lists render role).
- **New field:** `searchTerms: string[]` — tokenized name/workerId array maintained by a Cloud Function on write, replacing `fn_workers_search`'s trigram search (migration plan §6a).
- Indexes: `(status, majorMinistryId)`, `(status, minorMinistryId)` for filtered worker lists; single-field index on `workerId` (auto-indexed by default, no composite needed).

### `roles/{id}`
`name`, `isSuperAdmin`, `isSystemRole`, and — per the migration plan's §4.2 recommendation — a `permissions: { [module]: string[] }` map embedded directly on the doc rather than a separate join collection, since permission checks stay server-side (Admin SDK reads this doc directly, no Security Rules `get()` needed). This replaces `RolePermission` entirely; no separate collection needed.

### `permissions/{id}` (reference/catalog only)
`module`, `action`, `description?` — small, rarely-written catalog collection enumerating valid module/action pairs, used to populate the `roles.permissions` map in an admin UI. Not queried at runtime by permission checks (those read `roles/{roleId}.permissions` directly).

### No Firestore collection for `WorkerRole`
Prisma's `WorkerRole` join table (with `assignedBy`/`assignedAt`) becomes a single `roleId` (or `roleIds: string[]` if multi-role support is needed — confirm during implementation whether Worker ever holds >1 role concurrently in practice) field directly on `workers/{id}`, with `assignedBy`/`assignedAt` folded into that same field as a map, e.g. `roleAssignment: { roleId, assignedBy, assignedAt }`. Avoids a join-table collection for what is functionally a 1:1(ish) relationship.

---

## 2. Org structure

### `ministries/{id}`
`name`, `description`, `departmentCode` (soft ref to `departments/{code}`), `leaderId`, `headId?`, `approverId?`, `schedulerIds: string[]`, `mealStubAssignerId?`, `mealStubWeeklyLimit?`, `weight?`, `managerId?`.
- **Flag from the extraction:** Ministry has only 2 Postgres-enforced relations but is referenced by unenforced `ministryId` strings from ~10 other models (Booking, ScheduleAssignment, EventAssignment, MajorEventRequest, etc.) — functionally the second-most-referenced entity. Denormalize `ministryName` onto every doc that carries a `ministryId` (Cloud Function fan-out from `ministries/{id}` writes) so list views never need a second read.

### `departments/{code}` (doc ID = Department's natural `code`, not a generated ID)
`name`, `weight`. `DepartmentSetting` (currently a separate table keyed 1:1 by the same code, per the extraction's note that it has no enforced relation but is presumably keyed by Department.code) merges into this same doc as nested fields: `headId?`, `settingDescription?`, `mealStubWeekdayAllocation`, `mealStubSundayAllocation` — one fewer collection, since it's a 1:1 config extension with no independent query pattern.

### `areas/{id}`
`areaId?`, `name`, `branchId` (soft ref to `branches/{id}`).

### `branches/{id}`
`name`.

---

## 3. Scheduling

This is the domain your in-flight Month Editor work touches most directly (migration plan §10) — hold this design until that feature ships, per the plan's recommendation.

### `serviceSchedules/{id}`
`date`, `title`, `notes?`, `status`, `isPublic`, `publicToken?`, `createdBy`, `createdAt`, `updatedAt`.

### `serviceSchedules/{scheduleId}/assignments/{id}` (subcollection — replaces `ScheduleAssignment`)
`ministryId`, `ministryName` (denormalized), `roleName`, `workerId?`, `workerName?` (already denormalized in Prisma today), `notes?`, `rehearsalDate?`, `rehearsalTime?`, `order`, `acknowledgedAt?`, `acknowledgedBy?`, `attendanceStatus`, `slotType`, `approvalWorkflowId?`.
- Subcollection choice: assignments are always fetched scoped to one schedule (the Month Editor's actual access pattern), so nesting avoids a `scheduleId ==` filter on every read and keeps the collection naturally bounded per document.

### `serviceSchedules/{scheduleId}/worshipSlots/{id}` (subcollection — replaces `WorshipSlot`)
`ministryId?`, `slotName`, `isTws`, `order`, `notes?`, with `workers` as a **nested array of maps** (`{ workerId, workerName, role? }`) rather than a further-nested subcollection — `WorshipSlotWorker` rows are small, always read with their parent slot, and rarely queried independently, so an array field avoids an unnecessary third collection level.

### `masterSchedules/{workerId}` (doc ID = workerId, 1:1 with Worker — replaces `MasterSchedule`)
`shiftStart`, `shiftEnd`, `daysOff: number[]`, `effectiveFrom`, `updatedBy?`.

### `masterSchedules/{workerId}/overrides/{id}` (subcollection — replaces `MasterScheduleOverride`)
`date`, `shiftStart?`, `shiftEnd?`, `isDayOff`, `reason?`, `sourceType?`, `sourceId?`.
- Composite index: `(date)` ascending, scoped automatically by the parent path — no cross-worker override queries exist today per the extraction, so no additional composite needed unless that changes.

### `serviceTemplates/{id}`
`ministryId`, `name`, `isDefault`, `createdBy`.

### `serviceTemplates/{templateId}/roles/{id}` (subcollection — replaces `TemplateRole`)
`roleName`, `count`, `notes?`, `order`.

---

## 4. Attendance

### `attendanceRecords/{id}`
`workerProfileId`, `type`, `time`, `isLate`, `lateMinutes?`.
- Composite index: `(workerProfileId, time DESC)` — matches the existing Postgres `@@index([workerProfileId, time])` and the historical `database.indexes.json` leftover from the app's original Firebase era (§ discovery note below), which already declared exactly this index for `attendance_records`. Good independent confirmation this is the right shape.

### `attendanceSettings/global` (singleton doc, fixed ID `"global"`)
`gracePeriodMinutes`, `updatedBy?`.

### `workerAvailability/{id}`
`workerId`, `type`, `dayOfWeek?`, `date?`, `note?`.
- Composite index: `(workerId)` — single-field, auto-indexed.

---

## 5. Leave / Training

### `leaveRequests/{id}`
`workerId`, `type`, `startDate`, `endDate`, `reason`, `newShiftStart?`, `newShiftEnd?`, `days`, `status`, `workflowId?`, `balanceApplied`.
- Composite index: `(workerId, status)` for "my pending requests" views.

### `leaveBalances/{id}` — doc ID recommend `${workerId}_${type}_${year}` to preserve the Postgres `@@unique([workerId, type, year])` constraint as a Firestore doc-ID uniqueness guarantee (writes to the same key naturally overwrite rather than duplicate).
`workerId`, `type`, `year`, `totalDays`, `usedDays`, `updatedBy?`.

### `trainingRecords/{id}`
`workerId`, `name`, `dateCompleted?`, `expiryDate?`, `status`, `notes?`, `recordedBy?`.
- Composite index: `(workerId, status)`.

---

## 6. Venue / Booking

Second-highest-complexity domain after Inventory (migration plan §3), given `Room`'s fan-out and the multi-stage venue-assistance approval workflow.

### `bookings/{id}` (replaces `Booking` — the general room-booking table)
`requestId?`, `roomId`, `title`, `purpose?`, `start`, `end`, `status`, `workerProfileId`, `name`, `ministryId`, `email`, `requesterEmail?`, `dateRequested`, `pax`, `numTables?`, `numChairs?`, `equipmentTV`, `equipmentMic`, `equipmentSpeakers`, `requestedElements: string[]`, `guidelinesAccepted`, `checkedInAt?`.
- **Composite index: `(roomId, start)`** — this is the direct replacement for `fn_room_bookings_for_date` (migration plan §6), the single clearest 1:1 mapping in the whole schema.

### `rooms/{id}`
`name`, `capacity`, `elements: string[]`, `areaId`, `weight?`. High fan-out (5 enforced incoming relations) — no subcollections needed here since bookings/events/assistance-configs are each independently queried collections filtered by `roomId`, not naturally owned by Room.

### `roomDisplayDevices/{id}`
`name`, `token`, `roomId?`, `lastSeenAt?`.

### `roomDisplayPings/{roomId}` (doc ID = roomId — replaces `RoomDisplayPing`, direct 1:1 per migration plan §7)
`updatedAt` only — written by a Cloud Function `onWrite` trigger on `bookings/{id}`, read via client `onSnapshot`. No content, matches today's design exactly.

### `venueElements/{id}`
`name`, `category`, `providerMinistryId`.

### `venueBookings/{id}` (replaces `VenueBooking` — the ministry-approval-gated booking flow, distinct from plain `Booking`)
`requestId` (unique — enforce via Cloud Function check), `roomId`, `workerProfileId`, `title`, `purpose?`, `start`, `end`, `status`, `pax`, `numTables`, `numChairs`, `guidelinesAccepted`, `recurringBookingId?`.

### `venueBookings/{bookingId}/assistanceRequests/{id}` (subcollection — replaces `AssistanceRequest`)
`ministryId`, `status`, `explanation?`, `respondedAt?`, `respondedBy?`, `slaEscalatedAt?`, with `items` as a **nested array of maps** (`{ name, description?, quantity, isRequired, status, adjustedQty?, adjustedDesc? }`) rather than a further subcollection — mirrors the `WorshipSlot`/`worshipSlotWorker` decision above, since `AssistanceRequestItem` rows are always read/written together with their parent request.

### `recurringBookings/{id}`
`roomId`, `workerProfileId`, `title`, `purpose?`, `recurrenceRule`, `startTime`, `endTime`, `startDate`, `endDate?`, `pax`, `status`.

### `venueAuditLogs/{id}` (append-only)
`requestId?`, `configId?`, `action`, `actorId`, `before?` (Json → Firestore map), `after?` (Json → Firestore map), `triggerSource?`.

### `venueAssistanceSettings/global` (singleton)
`slaDays`, `updatedBy?`.

### `ministries/{ministryId}/workloadCategories/{id}` (subcollection of `ministries` — replaces `WorkloadCategory`)
`name`, `description?`, `sortOrder`. Nesting under `ministries` matches the Postgres `@@unique([ministryId, name])` constraint naturally (uniqueness within the subcollection scope) and matches its actual access pattern (always fetched per-ministry).

### `assistanceConfigurations/{id}` (replaces `AssistanceConfiguration` — doc ID recommend `${roomId}_${ministryId}` to preserve `@@unique([roomId, ministryId])`)
`roomId`, `ministryId`, `createdBy`, with `items` as a nested array of maps (mirrors `AssistanceRequestItem` decision above) rather than a separate `AssistanceConfigItem` collection.

---

## 7. Meals

### `mealStubs/{id}`
`workerId`, `workerName`, `scheduleId?`, `date`, `status`, `stubType?`, `assignedBy?`, `assignedByName?`, `claimedAt?`.
- Composite index: `(workerId, date DESC)` — again matches the historical `database.indexes.json` leftover (`mealstubs` collection, same shape) almost exactly, a useful independent sanity check on this design.

### `mealStubLedger/{id}` (append-only)
`workerId`, `ministryId?`, `departmentCode?`, `slotType`, `count`, `costPhp`, `scheduleId?`, `weekOf`, `source`.
- Composite indexes: `(workerId, weekOf)`, `(ministryId, weekOf)`.
- Running-balance denormalization (per migration plan §3's general guidance): if any UI shows a live running balance per worker, maintain a `mealStubBalance` field on `workers/{id}` via Cloud Function fan-out rather than summing the ledger client-side on every read.

---

## 8. C2S (mentorship)

### `c2sGroups/{id}`
`name`, `mentorId`, `menteeIds: string[]`, `location?`, `meetingSchedule?`, `currentModule?`, `ageGroupLabel?`, `ageRangeMin?`, `ageRangeMax?`, `meetupDay?`, `demographics: string[]`, `mapLng?`, `mapLat?`.

### `c2sGroups/{groupId}/mentees/{id}` (subcollection — replaces `C2SMentee`)
`firstName`, `lastName`, `email`, `phone`, `status`, `notes?`, `mentorId`.

### `c2sGroups/{groupId}/joinRequests/{id}` (subcollection — replaces `C2SJoinRequest`)
`firstName`, `lastName`, `email`, `phone?`, `message?`, `birthday?`, `gender?`, `socialMediaLink?`, `firstAttendedMonth?`, `firstAttendedYear?`, `privacyAccepted`, `status`, `workflowId?`.

### `c2sGroups/{groupId}/sessions/{id}` (subcollection — replaces `C2SSession`)
`date`, `module?`, `notes?`, `createdBy`.

### `c2sGroups/{groupId}/sessions/{sessionId}/attendance/{id}` (nested subcollection — replaces `C2SAttendanceRecord`)
`menteeId`, `present`. Doc ID recommend `menteeId` itself to preserve `@@unique([sessionId, menteeId])` as a natural doc-ID uniqueness guarantee.

---

## 9. Events

`ChurchEvent` sits right at the "high fan-out" threshold (4 enforced incoming relations, all naturally list-like) — treat it like `Worker`/`Room` for subcollection design.

### `churchEvents/{id}`
`title`, `description?`, `date`, `endDate?`, `startTime?`, `endTime?`, `location?`, `status`, `isPublic`, `videoUrl?`, `createdBy`, `notes?`, `scheduleId?`.
- Composite indexes: `(date)`, `(status)` — direct carry-over of the existing Postgres indexes.

### `churchEvents/{eventId}/signups/{id}` (subcollection — replaces `EventSignup`)
`name`, `email`, `phone?`, `guestCount`, `notes?`.

### `churchEvents/{eventId}/roomBookings/{id}` (subcollection — replaces `EventRoomBooking`)
`roomId`, `startTime`, `endTime`, `purpose?`, `notes?`.

### `churchEvents/{eventId}/assignments/{id}` (subcollection — replaces `EventAssignment`)
`ministryId`, `roleName`, `workerId?`, `workerName?`, `notes?`, `order`.

### `churchEvents/{eventId}/equipment/{id}` (subcollection — replaces `EventEquipment`)
`itemId` (soft ref to `inventoryItems/{id}`), `quantity`, `notes?`. Denormalize `itemName` onto this doc (Cloud Function fan-out from `inventoryItems` writes) since equipment lists render item names constantly.

---

## 10. Approvals (generic workflow engine)

### `approvalWorkflows/{id}` (replaces `ApprovalWorkflow`)
`type`, `subjectId`, `requesterId`, `status`, `metadata?` (Json → map), with `stages` as a **nested array of maps** rather than a separate `ApprovalStage` collection: `{ stageOrder, parallelGroup?, approverSpec, status, decidedBy?, decidedAt?, reason? }`.
- This is a deliberate deviation from the subcollection pattern used elsewhere: stages are small in number, always read/written as a full set (a workflow decision typically re-evaluates all stages together), and the polymorphic `approverSpec` JSON already doesn't benefit from being independently queryable. An array-of-maps avoids the overhead of a subcollection for what is functionally a single embedded state machine.
- Composite index: `(type, subjectId)`, `(requesterId)` — direct carry-over of existing Postgres indexes.

### `approvalRequests/{id}` (replaces the older, separate `ApprovalRequest` model — ad-hoc approvals like room-reassignment/ministry-transfer)
Kept as its own collection since it's a structurally different, older approval model per the extraction (not part of the generic workflow engine): `requester`, `type`, `details`, `date`, `status`, `workerId?`, `roomId?`, `reservationId?`, `requestId?`, `oldMajorId?`, `newMajorId?`, `oldMinorId?`, `newMinorId?`, `outgoingApproved?`, `incomingApproved?`.

---

## 11. Major events

### `majorEventServiceCatalog/{id}`
`ministryId`, `name`, `description?`, `sortOrder`, `active`.

### `majorEventRequests/{id}`
`title`, `description?`, `eventDate`, `endDate?`, `location?`, `requesterId`, `ministryId`, `status`.
- Composite indexes: `(requesterId)`, `(ministryId)`.

### `majorEventRequests/{requestId}/items/{id}` (subcollection — replaces `MajorEventRequestItem`)
`catalogItemId?`, `ministryId` (drives which parallel approval stage — kept denormalized here even though it duplicates the parent-adjacent structure, since items from different providing ministries need independent per-ministry querying within one request), `name`, `notes?`, `quantity?`, `status`.

### `majorEventSettings/global` (singleton)
`enabled`, `updatedBy?`.

---

## 12. Inventory — highest-risk domain (see migration plan §5)

**This section is design-only; per the migration plan, the module's browser→PostgREST→RLS architecture must move behind Server Actions/Cloud Functions *before* this schema is implemented, not as part of implementing it.**

### `inventoryCategories/{id}`
`name` (unique — enforce via Cloud Function check), `description?`, `color?`, `icon?`, `group?`, `isActive`.

### `inventoryItems/{id}`
`type` (`"EQUIPMENT" | "CONSUMABLE"` — the one true Prisma enum, carries over as a plain string union since Firestore has no enum type), `weight?`, `group?`, `categoryId`, `categoryName` (denormalized), `inventoryCode?` (unique — enforce via Cloud Function check), `name`, `role?`, `location?`, `aisle?`, `shelf?`, `bin?`, `assignedTo?`, `purchaseDate?`, `expiryDate?`, `nextMaintenanceDate?`, `parentId?` (self-reference for bundles — stays a plain field, Firestore has no self-relation concept either way), `isApprovalRequired`, `statusCode?`, `status?`, `statusDetails?`, `recommendation?`, `quantity`, `minQuantity`, `reorderLevel?`, `unit`, `imageUrl?`.
- **Concurrency-critical:** `quantity` mutations (`adjust_item_stock`'s Postgres `SELECT...FOR UPDATE` today) become a Firestore `runTransaction` reading and rewriting this field, paired with an `inventoryLogs` write inside the same transaction. Confirm this function is actually live code (flagged as possibly dead in the original research) before implementing the transaction.
- **Self-referential bundles:** `children` (the reverse of `parentId`) is not stored — query `inventoryItems where parentId == thisId` instead of maintaining a denormalized array, since bundle membership changes are infrequent and a stored array risks drifting from the `parentId` source of truth.

### `inventoryBorrowings/{id}`
`itemId`, `itemName` (denormalized), `borrowerId`, `borrowerName` (denormalized), `borrowedAt`, `dueDate?`, `returnedAt?`, `status`, `checkoutNotes?`, `checkoutCondition?`, `checkoutChecklist?` (Json → map), `returnNotes?`, `returnCondition?`, `returnChecklist?` (Json → map), `returnPhotos: string[]`.

### `inventoryLogs/{id}` (append-only)
`itemId`, `workerId?`, `type`, `quantity`, `balance`, `notes?`, `timestamp`.

---

## 13. Misc (low-risk cleanup domain, migrate last)

### `sermons/{id}`
`title`, `speaker?`, `date`, `scripture?`, `description?`, `videoUrl?`, `audioUrl?`, `isPublic`, `createdBy`.
- Composite index: `(date)`.

### `prayerRequests/{id}`
`name`, `email`, `phone?`, `type`, `message`, `status`, `assignedTo?`, `response?`.
- Composite index: `(status)`.

### `settings/{id}` (doc ID = caller-supplied key, replaces the generic `Setting` key-value table)
`data` (Json → map) — direct 1:1, Firestore documents are already schemaless maps so this needs no redesign at all.

### `transactionLogs/{id}` (append-only audit log)
`userId?`, `userEmail?`, `userName?`, `action`, `module`, `details?`, `targetId?`, `targetName?`, `before?` (Json → map), `after?` (Json → map), `reason?`, `timestamp`.

### `scanLogs/{id}` (append-only)
`scannerId`, `scannerName`, `timestamp`, `scanType`, `details`, `targetUserId?`, `targetUserName?`, `mealStubId?`, `reservationId?`.

### `inAppNotifications/{id}`
`userId`, `title`, `body`, `link?`, `read`, `createdAt`.
- **Gap noted in the extraction:** no Postgres index exists today on `(userId, read)` despite that being the obvious query pattern for a notifications inbox — add this as a genuinely new composite index in Firestore rather than carrying over an absence.

### `notificationPreferences/{workerId}` (doc ID = workerId, 1:1 — replaces `NotificationPreference`)
`emailEnabled`.

---

## A note on the repo's own Firestore history

While scaffolding Phase 0, we noted the app had an early Firebase Studio phase, a Supabase Auth/hosting interval (~March 2026), and has since cut `apps/web` back to **Firebase Auth + App Hosting** with Postgres/Prisma as SoT. Root `apphosting.yaml` is active again; `database.indexes.json` is a leftover from an older, smaller Firestore schema. `database.indexes.json` declares indexes for `attendance_records`, `mealstubs`, and `reservations` collections from the old, much smaller schema. Where those overlap with domains above (`attendanceRecords`, `mealStubs`), the old index shapes independently confirm the `(workerId/workerProfileId, date/time)` composite pattern chosen here — reassuring, but that file predates the current 68-model Prisma schema and should not be treated as authoritative; it will be reconciled or retired once `firestore.indexes.json` is populated domain by domain in Phase 3.

## Open questions carried over from the migration plan (§14) that this doc doesn't resolve

- Whether `roleIds` needs to be an array (multi-role workers) rather than the single `roleId` assumed in §1 — check actual usage before implementing.
- Final decision on tokenized-array vs. external search service for `workers.searchTerms` (§1) — plan recommends starting with the tokenized array.
- Whether `adjust_item_stock` (referenced in §12) is live code before porting its transaction logic.
