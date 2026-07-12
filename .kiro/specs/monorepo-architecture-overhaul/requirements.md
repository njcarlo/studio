# Requirements Document

> **Superseded direction for `apps/web`:** This spec targeted Supabase Edge
> Functions. The shipped architecture uses **Firebase Auth**, **Firebase App
> Hosting**, **Prisma/Postgres**, and **Firebase Cloud Functions** (`functions/`).
> Keep useful module-boundary ideas; do **not** implement new Supabase Edge
> Functions for the web app. See `docs/ONBOARDING.md` and `docs/architecture.md`.
> `apps/inventory` / `apps/tract-tracker` may still be on Supabase.


## Introduction

This document defines the requirements for a full architectural overhaul of the Studio monorepo. The current system has all business logic locked inside `apps/web` (a ~1100-line `db.ts` server actions monolith) and `apps/inventory`, making it impossible for mobile apps and future clients to reuse that logic. The overhaul extracts all business logic into Supabase Edge Functions (one per domain module), introduces a new `@studio/client` typed SDK package that all clients consume, and reduces `apps/web` and `apps/inventory` to thin presentation layers. Migration is performed module by module to avoid breaking existing functionality.

---

## Glossary

- **Edge_Function**: A Supabase Edge Function (Deno runtime) deployed to `supabase/functions/{module}/index.ts`, acting as a mini REST API for one domain module.
- **Client_SDK**: The `@studio/client` monorepo package that wraps all Edge Function HTTP calls with typed request/response interfaces.
- **Module**: A self-contained domain area (workers, schedule, ministries, venue, approvals, meals, attendance, inventory, c2s, settings) that maps 1:1 to an Edge Function.
- **Router**: The request-dispatching layer inside each Edge Function that maps HTTP method + path to a handler function.
- **JWT**: A Supabase-issued JSON Web Token carried in the `Authorization: Bearer` header of every request to an Edge Function.
- **Presentation_Layer**: An app (`apps/web` or `apps/inventory`) after the overhaul — responsible only for routing, UI rendering, and calling the Client_SDK; contains no direct database access.
- **Server_Action**: A Next.js `"use server"` function in `apps/web/src/actions/` that currently performs direct Prisma database calls.
- **Prisma**: The ORM currently used by `apps/web` and `@studio/database` to access the Supabase PostgreSQL database.
- **Supabase_Client**: The `@supabase/supabase-js` SDK used to interact with Supabase services (auth, database, storage).
- **Worker**: A church staff or volunteer profile stored in the `Worker` table.
- **Migration_Phase**: A discrete, independently deployable step that moves one Module from Server_Actions to an Edge_Function without breaking other Modules.

---

## Requirements

### Requirement 1: Edge Function Per Module

**User Story:** As a platform architect, I want each domain module to be deployed as an independent Supabase Edge Function, so that business logic is decoupled from any specific client application and can be consumed by web, mobile, and future clients uniformly.

#### Acceptance Criteria

1. THE System SHALL provide one Edge_Function for each of the following modules: `workers`, `schedule`, `ministries`, `venue`, `approvals`, `meals`, `attendance`, `inventory`, and `c2s`.
2. THE System SHALL deploy each Edge_Function at the path `supabase/functions/{module}/index.ts`.
3. WHEN an HTTP request arrives at an Edge_Function, THE Router SHALL dispatch it to the correct handler based on the HTTP method and URL path.
4. THE Edge_Function SHALL support standard HTTP methods: `GET`, `POST`, `PUT`, `PATCH`, and `DELETE`.
5. THE Edge_Function SHALL return responses with `Content-Type: application/json` and appropriate HTTP status codes (`200`, `201`, `400`, `401`, `403`, `404`, `500`).
6. IF an unmatched route is requested, THEN THE Router SHALL return a `404` response with a JSON error body.
7. IF an internal error occurs during handler execution, THEN THE Edge_Function SHALL return a `500` response with a JSON error body and SHALL log the error details.

---

### Requirement 2: JWT Authentication at Edge Function Entry

**User Story:** As a security engineer, I want every Edge Function to verify the caller's identity before executing any business logic, so that unauthenticated requests are rejected at the boundary.

#### Acceptance Criteria

1. WHEN a request arrives at any Edge_Function, THE Edge_Function SHALL extract the `Authorization: Bearer {token}` header and verify the JWT using the Supabase project's JWT secret before invoking any handler.
2. IF the `Authorization` header is absent or malformed, THEN THE Edge_Function SHALL return a `401` response and SHALL NOT invoke any handler.
3. IF the JWT signature is invalid or the token is expired, THEN THE Edge_Function SHALL return a `401` response and SHALL NOT invoke any handler.
4. WHEN JWT verification succeeds, THE Edge_Function SHALL make the authenticated user's `id` and `role` claims available to all downstream handlers within the same request.
5. THE Edge_Function SHALL support CORS preflight (`OPTIONS`) requests by returning a `200` response with appropriate `Access-Control-Allow-*` headers without requiring JWT verification.

---

### Requirement 3: @studio/client SDK Package

**User Story:** As a frontend developer, I want a single typed SDK package that wraps all Edge Function calls, so that I can call backend operations from any client app without writing raw `fetch` calls or duplicating request logic.

#### Acceptance Criteria

1. THE System SHALL provide a `@studio/client` package at `packages/client/` within the monorepo.
2. THE Client_SDK SHALL export one typed client module per Module (e.g., `WorkersClient`, `ScheduleClient`, `MinistriesClient`, `VenueClient`, `ApprovalsClient`, `MealsClient`, `AttendanceClient`, `InventoryClient`, `C2SClient`).
3. WHEN a client module function is called, THE Client_SDK SHALL construct the correct HTTP request (method, path, headers, body) and send it to the corresponding Edge_Function URL.
4. THE Client_SDK SHALL accept a Supabase session token and SHALL include it as the `Authorization: Bearer {token}` header on every request.
5. WHEN an Edge_Function returns a `2xx` response, THE Client_SDK SHALL parse the JSON body and return it as a typed TypeScript value.
6. IF an Edge_Function returns a non-`2xx` response, THEN THE Client_SDK SHALL throw a typed error containing the HTTP status code and the error message from the response body.
7. THE Client_SDK SHALL be usable in both browser environments (Next.js client components) and React Native environments (Expo) without platform-specific code.
8. THE Client_SDK SHALL export all request and response types so that consuming applications can use them for local state typing without importing from `@studio/types` directly.

---

### Requirement 4: apps/web Overhaul — Thin Presentation Layer

**User Story:** As a web developer, I want `apps/web` to contain only routing and UI code, so that the Next.js app is easy to maintain and does not duplicate business logic that already lives in Edge Functions.

#### Acceptance Criteria

1. THE System SHALL remove all Server_Actions from `apps/web/src/actions/db.ts` that correspond to a migrated Module, replacing each call site with the equivalent `@studio/client` function.
2. WHEN a page or component in `apps/web` needs data, THE Presentation_Layer SHALL call the Client_SDK and SHALL NOT call Prisma or the Supabase database client directly.
3. THE System SHALL remove the `@studio/database` dependency from `apps/web/package.json` after all Modules have been migrated.
4. THE System SHALL remove the `@prisma/client` dependency from `apps/web/package.json` after all Modules have been migrated.
5. WHILE a Module migration is in progress, THE System SHALL preserve the existing Server_Actions for that Module so that unmigrated pages continue to function.
6. THE Presentation_Layer SHALL continue to use the existing Zustand stores in `@studio/store` for client-side state management after migration.
7. THE System SHALL preserve all existing Next.js routes and their URL paths after migration; no route renames or removals are permitted during the overhaul.

---

### Requirement 5: apps/inventory Overhaul — Thin Presentation Layer

**User Story:** As an inventory manager, I want the inventory app to call the shared `inventory` Edge Function instead of hitting Supabase directly, so that inventory business logic is centralised and accessible to future mobile clients.

#### Acceptance Criteria

1. THE System SHALL replace all direct Supabase client calls in `apps/inventory/src/lib/inventory-api.ts` with equivalent `InventoryClient` calls from `@studio/client`.
2. WHEN the inventory app needs to read or write inventory data, THE Presentation_Layer SHALL call the Client_SDK and SHALL NOT call the Supabase database client directly.
3. THE System SHALL preserve all existing inventory features (items, categories, borrowings, stock logs, dashboard stats) after migration.
4. THE System SHALL remove the direct `@supabase/supabase-js` dependency from `apps/inventory/package.json` after migration, retaining only the `@studio/client` dependency for data access.

---

### Requirement 6: Workers Module Edge Function

**User Story:** As a church administrator, I want worker profile management to be served by a dedicated Edge Function, so that worker data is accessible to both the web app and future mobile apps.

#### Acceptance Criteria

1. THE `workers` Edge_Function SHALL expose endpoints to create, read, update, and delete Worker profiles.
2. THE `workers` Edge_Function SHALL expose endpoints to list, assign, and remove roles from Workers.
3. THE `workers` Edge_Function SHALL expose an endpoint to fetch a Worker's permissions derived from their assigned roles.
4. WHEN a Worker is fetched by Firebase UID or email, THE `workers` Edge_Function SHALL return the matching Worker profile or a `404` response if no match exists.
5. IF a request attempts to delete or deactivate a Worker who has active schedule assignments, THEN THE `workers` Edge_Function SHALL return a `409` response with a descriptive error message.

---

### Requirement 7: Schedule Module Edge Function

**User Story:** As a scheduler, I want service schedules, templates, assignments, and worship slots to be managed through a dedicated Edge Function, so that scheduling logic is reusable across web and mobile clients.

#### Acceptance Criteria

1. THE `schedule` Edge_Function SHALL expose endpoints to create, read, update, and delete service schedules and schedule templates.
2. THE `schedule` Edge_Function SHALL expose endpoints to assign Workers to schedule slots and to remove those assignments.
3. THE `schedule` Edge_Function SHALL expose endpoints to manage worship slots within a schedule.
4. WHEN a schedule is created from a template, THE `schedule` Edge_Function SHALL copy all slot definitions from the template into the new schedule.
5. IF a Worker is assigned to a slot for which they lack the required role or ministry membership, THEN THE `schedule` Edge_Function SHALL return a `422` response with a descriptive validation error.

---

### Requirement 8: Ministries Module Edge Function

**User Story:** As a ministry leader, I want ministry management, workload categories, and ministry manager assignments to be served by a dedicated Edge Function, so that ministry data is consistent across all client apps.

#### Acceptance Criteria

1. THE `ministries` Edge_Function SHALL expose endpoints to create, read, update, and delete ministries.
2. THE `ministries` Edge_Function SHALL expose endpoints to manage workload categories associated with ministries.
3. THE `ministries` Edge_Function SHALL expose endpoints to assign and remove ministry managers.
4. WHEN a ministry is fetched, THE `ministries` Edge_Function SHALL include the ministry's department code, manager list, and active member count in the response.
5. IF a ministry deletion is requested and the ministry has active Worker assignments, THEN THE `ministries` Edge_Function SHALL return a `409` response.

---

### Requirement 9: Venue Module Edge Function

**User Story:** As a facilities coordinator, I want room reservations, venue assistance requests, and recurring bookings to be managed through a dedicated Edge Function, so that venue data is accessible to web and future mobile clients.

#### Acceptance Criteria

1. THE `venue` Edge_Function SHALL expose endpoints to create, read, update, and delete room reservations.
2. THE `venue` Edge_Function SHALL expose endpoints to manage venue assistance requests and their status transitions.
3. THE `venue` Edge_Function SHALL expose endpoints to create and manage recurring bookings using recurrence rules.
4. WHEN a room reservation is created, THE `venue` Edge_Function SHALL check for conflicting reservations in the same room and time window and SHALL return a `409` response if a conflict exists.
5. WHEN a recurring booking is expanded, THE `venue` Edge_Function SHALL generate individual reservation instances according to the recurrence rule up to a configurable horizon.

---

### Requirement 10: Approvals Module Edge Function

**User Story:** As a department head, I want approval request workflows to be handled by a dedicated Edge Function, so that approval state transitions are enforced consistently regardless of which client initiates them.

#### Acceptance Criteria

1. THE `approvals` Edge_Function SHALL expose endpoints to create, read, and list approval requests.
2. THE `approvals` Edge_Function SHALL expose endpoints to approve or reject a pending approval request.
3. WHEN an approval request transitions to `approved` or `rejected`, THE `approvals` Edge_Function SHALL record the approver's Worker ID and the timestamp of the decision.
4. IF a Worker without approval authority attempts to approve or reject a request, THEN THE `approvals` Edge_Function SHALL return a `403` response.
5. IF an approval action is attempted on a request that is not in `pending` status, THEN THE `approvals` Edge_Function SHALL return a `409` response.

---

### Requirement 11: Meals Module Edge Function

**User Story:** As a meals coordinator, I want meal stub management and allocation to be served by a dedicated Edge Function, so that meal data is consistent and accessible to all client apps.

#### Acceptance Criteria

1. THE `meals` Edge_Function SHALL expose endpoints to create, read, update, and delete meal stubs.
2. THE `meals` Edge_Function SHALL expose endpoints to allocate meal stubs to Workers for a given service date.
3. WHEN a meal stub is scanned or redeemed, THE `meals` Edge_Function SHALL mark it as used and SHALL record the redemption timestamp and Worker ID.
4. IF a meal stub that has already been redeemed is submitted for redemption again, THEN THE `meals` Edge_Function SHALL return a `409` response.

---

### Requirement 12: Attendance Module Edge Function

**User Story:** As an attendance officer, I want attendance records and QR scanning to be handled by a dedicated Edge Function, so that attendance data is accessible to both the web app and future mobile scanning apps.

#### Acceptance Criteria

1. THE `attendance` Edge_Function SHALL expose endpoints to create, read, and list attendance records.
2. THE `attendance` Edge_Function SHALL expose an endpoint that accepts a QR code payload and records attendance for the corresponding Worker.
3. WHEN a QR code is submitted, THE `attendance` Edge_Function SHALL validate that the QR code corresponds to an active Worker and SHALL return a `404` response if no match is found.
4. IF a duplicate attendance record is submitted for the same Worker and service date, THEN THE `attendance` Edge_Function SHALL return a `409` response.
5. THE `attendance` Edge_Function SHALL expose an endpoint to retrieve attendance statistics aggregated by date range and ministry.

---

### Requirement 13: Inventory Module Edge Function

**User Story:** As an inventory manager, I want all inventory operations (items, categories, borrowings, stock logs) to be served by a dedicated Edge Function, so that inventory logic is centralised and reusable by future mobile clients.

#### Acceptance Criteria

1. THE `inventory` Edge_Function SHALL expose endpoints to create, read, update, and delete inventory items and categories.
2. THE `inventory` Edge_Function SHALL expose endpoints to record stock adjustments (`Stock In`, `Stock Out`, `Adjustment`) and SHALL update the item's quantity atomically.
3. THE `inventory` Edge_Function SHALL expose endpoints to create borrowing records and to process item returns.
4. THE `inventory` Edge_Function SHALL expose an endpoint to retrieve stock logs filtered by item, ministry, and date range.
5. WHEN a `Stock Out` adjustment would reduce an item's quantity below zero, THE `inventory` Edge_Function SHALL clamp the resulting quantity to zero and SHALL record the actual delta applied.
6. THE `inventory` Edge_Function SHALL scope all item and log queries by `ministryId` when provided, and SHALL return all records when `ministryId` is absent (super-admin access).

---

### Requirement 14: C2S Module Edge Function

**User Story:** As a discipleship leader, I want C2S (discipleship group) management to be served by a dedicated Edge Function, so that group data is accessible to web and future mobile clients.

#### Acceptance Criteria

1. THE `c2s` Edge_Function SHALL expose endpoints to create, read, update, and delete discipleship groups.
2. THE `c2s` Edge_Function SHALL expose endpoints to add and remove members from discipleship groups.
3. WHEN a discipleship group is fetched, THE `c2s` Edge_Function SHALL include the group leader's Worker profile and the current member count in the response.

---

### Requirement 15: Module-by-Module Migration Strategy

**User Story:** As a development team lead, I want each module to be migrated independently without breaking existing functionality, so that the team can ship incremental improvements without a risky big-bang cutover.

#### Acceptance Criteria

1. THE System SHALL support running the old Server_Actions and the new Edge_Function for the same Module simultaneously during a Migration_Phase.
2. WHEN a Module's Edge_Function is deployed and the Client_SDK is updated, THE System SHALL allow individual pages in `apps/web` to be switched to the Client_SDK one at a time.
3. THE System SHALL not require a full rebuild or redeployment of unrelated Modules when a single Module is migrated.
4. WHEN all pages for a Module have been switched to the Client_SDK, THE System SHALL allow the corresponding Server_Actions to be deleted without affecting other Modules.
5. THE System SHALL maintain a migration status record (e.g., in this spec's tasks document) tracking which Modules are `not started`, `in progress`, or `complete`.

---

### Requirement 16: Shared Type Contracts

**User Story:** As a TypeScript developer, I want all request and response shapes to be defined once and shared across Edge Functions and the Client SDK, so that type drift between the backend and frontend is impossible.

#### Acceptance Criteria

1. THE System SHALL define all Edge Function request and response types in `@studio/types` or within the `@studio/client` package, not inline in individual apps.
2. WHEN an Edge_Function handler is updated to add or remove a field, THE Client_SDK types SHALL be updated in the same commit to reflect the change.
3. THE Client_SDK SHALL re-export all domain types so that consuming apps do not need to import from `@studio/types` directly for data-layer types.
4. THE System SHALL use `zod` schemas to validate incoming request bodies in each Edge_Function handler, and the same schemas SHALL be used to derive the TypeScript types exported by `@studio/client`.

---

### Requirement 17: Error Handling and Observability

**User Story:** As an operations engineer, I want all Edge Functions to handle errors consistently and emit structured logs, so that failures are easy to diagnose in production.

#### Acceptance Criteria

1. THE Edge_Function SHALL catch all unhandled exceptions in handler functions and SHALL return a `500` JSON response rather than letting the Deno runtime return an unformatted error.
2. WHEN an error occurs, THE Edge_Function SHALL log a structured JSON entry containing the module name, route, HTTP method, error message, and stack trace.
3. THE Client_SDK SHALL surface Edge_Function error messages in its thrown error objects so that consuming apps can display meaningful error messages to users.
4. IF a request body fails `zod` validation, THEN THE Edge_Function SHALL return a `400` response containing the list of validation errors in a structured JSON format.

---

### Requirement 18: Settings Module Edge Function

**User Story:** As a system administrator, I want roles, rooms, departments, and venue elements to be managed through a dedicated Edge Function, so that configuration data is accessible to all client apps.

#### Acceptance Criteria

1. THE `settings` Edge_Function SHALL expose endpoints to create, read, update, and delete roles and their permission assignments.
2. THE `settings` Edge_Function SHALL expose endpoints to create, read, update, and delete rooms and venue elements.
3. THE `settings` Edge_Function SHALL expose endpoints to create, read, update, and delete departments.
4. WHEN a role is deleted, THE `settings` Edge_Function SHALL verify that no Workers are currently assigned to that role and SHALL return a `409` response if any assignments exist.
5. WHEN a room is deleted, THE `settings` Edge_Function SHALL verify that no active reservations reference that room and SHALL return a `409` response if any exist.
