# COG App v2 — Development Prompt

## Project Overview

Build **COG App v2** (`cogapp-v2`) — a modern Next.js web application that consolidates and replaces two legacy CodeIgniter 3 systems:

1. **C2S** (Connect 2 Souls) — Mentorship & discipleship management
2. **ORS** (Online Reservation System) — Organizational resource management (service requests, venue/equipment reservations, training, meals, worker management)

Both legacy systems share a single MySQL database: **`cogdasma_db`**. The legacy database will be fully migrated to Supabase (PostgreSQL) — MySQL will not be retained.

This app is designed to be **scalable and extensible** — C2S and ORS are the initial feature sets, but new modules will be added over time. The architecture must support clean module boundaries and easy feature additions.

---

## Tech Stack

### Core

| Layer      | Technology               |
| ---------- | ------------------------ |
| Framework  | Next.js 15 (App Router)  |
| Language   | TypeScript (strict mode) |
| Runtime    | React 19                 |
| Styling    | Tailwind CSS             |
| Path Alias | `@/*` → `./src/*`        |

### Backend & Infrastructure

| Concern        | Technology              | Notes                                                |
| -------------- | ----------------------- | ---------------------------------------------------- |
| Database       | Supabase (PostgreSQL)   | Replaces legacy MySQL — clean schema, not 1:1 copy   |
| Auth           | Supabase Auth           | Replaces MD5 sessions — JWT, RLS, social login ready |
| Realtime       | Supabase Realtime       | Approval notifications, live status updates          |
| File Storage   | Supabase Storage        | Profile images, attachments                          |
| Hosting        | Vercel                  | Serverless functions, edge middleware                |
| Cron Jobs      | Vercel Cron             | 90-day deactivation trigger, scheduled tasks         |
| Edge Functions | Supabase Edge Functions | Background processing, webhooks                      |

### Notifications

| Channel | Technology                     | Notes                                                   |
| ------- | ------------------------------ | ------------------------------------------------------- |
| Email   | Resend                         | Transactional email — replaces legacy `email_job` queue |
| Push    | Supabase Realtime + Web Push   | Cross-platform push path for web + future mobile        |
| In-App  | Supabase Realtime              | Live approval/status notifications                      |

### UI & Libraries

| Concern       | Technology                       | Notes                                      |
| ------------- | -------------------------------- | ------------------------------------------ |
| UI Components | shadcn/ui + Radix UI             | Accessible, Tailwind-native                |
| Data Fetching | TanStack Query (React Query)     | Caching, optimistic updates                |
| Forms         | React Hook Form + Zod            | Validation — replaces legacy CI form rules |
| Charts        | Recharts                         | Dashboard analytics from C2S + ORS         |
| Calendar      | FullCalendar or react-day-picker | Venue reservation calendar view            |
| QR Codes      | qrcode.react + html5-qrcode      | Meal stub generation + scanner             |
| Tables        | TanStack Table                   | Data-heavy views (workers, SRs, reports)   |

### Mobile Strategy

- **Web-first**: Responsive Next.js app — mobile-ready from day one, works in any mobile browser
- **Native mobile**: **Capacitor** (Ionic) wraps the same Next.js web app into native iOS/Android shells
  - Produces real `.ipa` / `.apk` — deployable to App Store & Play Store
  - **Builds locally** via Xcode & Android Studio — no cloud queue, no EAS dependency
  - Same codebase as web — no separate mobile project to maintain
  - Access to native APIs (push notifications, camera, biometrics, haptics) via Capacitor plugins
  - `npx cap sync` to push web changes to native shells
- Both web and native share the same Supabase backend, auth, and API layer
- The legacy C2S mobile app will NOT be maintained — it will be replaced entirely

### Architecture Principles

- **Modular**: Each feature domain is a fully self-contained module (see Module Architecture below)
- **Extensible**: New modules can be added without touching existing ones — the app will grow into an ERP-like system
- **Shared core**: Common concerns (auth, layout, navigation, notifications, approvals) live in shared directories
- **API layer**: All data access goes through Supabase client hooks — no direct DB calls in components

---

## Module Architecture

COG App is built as a **modular ERP-like system**. Every feature lives inside a module. Modules are the fundamental unit of organization — they encapsulate everything about a feature domain: routes, components, hooks, types, permissions, and database schema.

### Why Modules

- The app will continuously grow with new features — modules prevent the codebase from becoming a tangled monolith
- Each module can be understood, developed, and tested in isolation
- Modules can be enabled/disabled per deployment or per organization (future multi-tenant)
- New developers (or AI agents) can add a feature by creating a single module folder — no need to understand the entire codebase

### Module Structure

Every module follows the same folder convention:

```
src/modules/{module-name}/
├── index.ts                    # Module registration (exports config)
├── permissions.ts              # Module permissions (registered in RBAC)
├── menu.ts                     # Sidebar menu items for this module
├── routes.ts                   # Route definitions (optional, if not using file-based routing)
├── types/                      # TypeScript types & Zod schemas
│   └── index.ts
├── hooks/                      # React Query hooks (Supabase data access)
│   ├── use-groups.ts
│   └── use-group-detail.ts
├── components/                 # Module-specific UI components
│   ├── group-card.tsx
│   ├── group-form.tsx
│   └── group-table.tsx
├── pages/                      # Page components (imported by app router)
│   ├── list.tsx
│   ├── detail.tsx
│   └── create.tsx
└── utils/                      # Module-specific helpers (optional)
    └── validation.ts
```

### Module Registration

Each module exports a config object that the core system uses to wire everything up:

```typescript
// src/modules/mentorship/index.ts
import { defineModule } from "@/lib/modules";
import { permissions } from "./permissions";
import { menuItems } from "./menu";

export default defineModule({
  id: "mentorship",
  name: "Mentorship",
  description: "Mentoring groups, connections, and discipleship tracking",
  version: "1.0.0",
  permissions,
  menuItems,
  enabled: true, // can be toggled off
});
```

### Module Registry

All modules are registered in a central registry. This is the **single place** that controls what's active:

```typescript
// src/modules/index.ts — the module registry
import mentorship from "./mentorship";
import connections from "./connections";
import venues from "./venues";
import serviceRequests from "./service-requests";
import training from "./training";
import meals from "./meals";
import workerPass from "./worker-pass";
import workers from "./workers";
import roles from "./roles";
import signage from "./signage";
import system from "./system";

export const modules = [
  mentorship,
  connections,
  venues,
  serviceRequests,
  training,
  meals,
  workerPass,
  workers,
  roles,
  signage,
  system,
];
```

Adding a new module = create the folder, export the config, add one line to the registry. The core system handles:

- Merging menu items into the sidebar (filtered by permissions)
- Registering permissions in the RBAC system
- Including routes in the app router

### App Router Integration

Modules own their pages, but the Next.js App Router provides the file-based routing. Module pages are imported by the route files:

```
src/app/(authenticated)/
├── dashboard/
│   └── page.tsx                        # Dashboard (core, not a module)
├── mentorship/
│   ├── groups/
│   │   ├── page.tsx                    # → imports modules/mentorship/pages/list
│   │   ├── [id]/
│   │   │   └── page.tsx               # → imports modules/mentorship/pages/detail
│   │   └── new/
│   │       └── page.tsx               # → imports modules/mentorship/pages/create
│   ├── connections/
│   │   └── page.tsx                   # → imports modules/connections/pages/list
│   ├── registration/
│   │   └── page.tsx
│   └── reports/
│       └── page.tsx
├── venues/
│   ├── page.tsx                        # → imports modules/venues/pages/list
│   ├── calendar/
│   │   └── page.tsx
│   └── [id]/
│       └── page.tsx
├── service-requests/
│   ├── page.tsx
│   ├── [id]/
│   │   └── page.tsx
│   └── new/
│       └── page.tsx
├── training/
│   └── page.tsx
├── meals/
│   ├── page.tsx
│   └── scan/
│       └── page.tsx
├── worker-pass/
│   └── page.tsx
└── admin/
    ├── workers/
    │   ├── page.tsx
    │   └── [id]/
    │       └── page.tsx
    ├── roles/
    │   ├── page.tsx
    │   └── [id]/
    │       └── page.tsx
    ├── audit/
    │   └── page.tsx
    └── settings/
        └── page.tsx
```

Route page files are thin wrappers — they import the module's page component and declare the required permission:

```typescript
// src/app/(authenticated)/mentorship/groups/page.tsx
import { GroupListPage } from "@/modules/mentorship/pages/list";
export const metadata = { title: "Mentorship Groups" };
export default GroupListPage;
```

### Shared Core (Not Modules)

These are NOT modules — they are shared infrastructure used by all modules:

```
src/
├── lib/
│   ├── supabase/                # Supabase client, auth helpers
│   ├── modules/                 # Module system (defineModule, registry loader)
│   ├── permissions/             # RBAC engine, usePermission, <Can>
│   ├── navigation/              # Sidebar builder (reads from module configs)
│   └── notifications/           # Email (Resend), push (FCM), in-app (Realtime)
├── components/
│   ├── ui/                      # shadcn/ui base components (Button, Card, Input, etc.)
│   ├── layout/                  # AppShell, Sidebar, Header, Footer, Breadcrumb
│   ├── auth/                    # Login form, auth guards
│   ├── common/                  # DataTable, PageHeader, ConfirmDialog, EmptyState
│   └── impersonation/           # Impersonation banner, context
├── hooks/
│   ├── use-auth.ts              # Auth state, current worker
│   ├── use-permission.ts        # Permission checks
│   └── use-impersonation.ts     # Impersonation state
├── types/
│   └── index.ts                 # Shared types (Worker, Role, Permission, Module)
└── app/
    ├── (auth)/                  # Public auth pages (login, forgot password)
    └── (authenticated)/         # Protected pages (layout with sidebar + header)
```

### Rules for Module Development

When creating or modifying a module, follow these rules:

1. **No cross-module imports**: Module A must NOT import from Module B. If two modules need to share logic, extract it to `src/lib/` or `src/components/common/`
2. **Permissions first**: Define permissions in `permissions.ts` before building UI. Every page and action must have a permission
3. **Types in module**: Module-specific types live in `modules/{name}/types/`, not in the global `src/types/`
4. **Hooks wrap Supabase**: All data access goes through hooks in `modules/{name}/hooks/`. No raw Supabase calls in components
5. **Thin route files**: `src/app/` route files only import and re-export from modules — no business logic in route files
6. **Self-documenting**: Each module's `index.ts` exports a complete config — reading it tells you everything the module does

### Initial Modules

| Module           | ID                 | Origin | Description                                                      |
| ---------------- | ------------------ | ------ | ---------------------------------------------------------------- |
| Mentorship       | `mentorship`       | C2S    | Physical + online groups, mentee management                      |
| Connections      | `connections`      | C2S    | Personal discipleship contact tracking                           |
| Venues           | `venues`           | ORS    | Venue + equipment reservations, calendar                         |
| Service Requests | `service-requests` | ORS    | Ticketing, work orders, approval workflows                       |
| Training         | `training`         | ORS    | Course tracking, worker completion mapping                       |
| Meals            | `meals`            | ORS    | Meal events, QR scanning, canteen tracking, redemption dashboard |
| Worker Pass      | `worker-pass`      | ORS    | Worker pass generation, batch management                         |
| Workers          | `workers`          | Shared | Worker profiles, bulk operations                                 |
| Roles            | `roles`            | New    | RBAC admin — roles, permissions, assignment                      |
| Signage          | `signage`          | ORS    | Digital room signage displays (13 rooms)                         |
| System           | `system`           | New    | Audit logs, settings, email templates                            |

Future modules (examples): Announcements, Attendance, Finance, Inventory, Events, etc. — each follows the same pattern.

### Digital Room Signage

Replaces the legacy CodeIgniter + XAMPP-per-room setup. Each of the **13 rooms** has a mini computer with a small monitor mounted outside the door, displaying real-time room availability. The new approach is vastly simpler.

**Legacy approach** (what we're replacing):

- Each room: mini computer running XAMPP + CodeIgniter app
- Polls ORS MySQL database every 15 seconds
- 13 separate local server installations to maintain

**New approach**:

- Each room: mini computer with a **browser in kiosk/fullscreen mode** pointing to a URL
- URL: `https://cogapp.vercel.app/signage/[room-id]` (public, no auth required)
- **Supabase Realtime** subscription — instant updates, no polling
- Zero server software per room — just a browser
- Can run on anything: Raspberry Pi, Fire TV Stick, old tablet, Chromebox, any PC

#### Signage Display Page (`/signage/[room-id]`)

A **public route** (no authentication) — this is a kiosk display, not an admin page.

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                      Conference Room A                       │
│                      ─────────────────                       │
│                                                              │
│              ┌────────────────────────────┐                  │
│              │                            │                  │
│              │        AVAILABLE           │                  │
│              │                            │                  │
│              │     ● Green pulsing dot    │                  │
│              │                            │                  │
│              └────────────────────────────┘                  │
│                                                              │
│         Next reservation: 2:00 PM — 4:00 PM                 │
│         Worship Team Planning (Music Ministry)               │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ 8:00 AM  │  │ 10:00 AM │  │ 2:00 PM  │  │ 4:30 PM  │    │
│  │ Team Mtg │  │ FREE     │  │ Worship  │  │ FREE     │    │
│  │ ████████ │  │          │  │ ████████ │  │          │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                              │
│                    Mar 14, 2026 · 11:42 AM                   │
└──────────────────────────────────────────────────────────────┘
```

**Display elements**:

| Element              | Description                                                                                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Room name**        | Large text, top center                                                                                                                                                        |
| **Status badge**     | `AVAILABLE` (green) / `OCCUPIED` (red) / `RESERVED` (amber, starts in <15 min) — large, dominant center element                                                               |
| **Status indicator** | Pulsing dot or glow effect matching the status color                                                                                                                          |
| **Current event**    | If occupied: event name, organizer, time remaining ("Ends in 45 min")                                                                                                         |
| **Next reservation** | If available: shows next upcoming reservation time and title                                                                                                                  |
| **Day timeline**     | Horizontal row of time blocks showing today's schedule — filled blocks = reserved, empty = free                                                                               |
| **Clock**            | Current date and time, bottom center, updates every second                                                                                                                    |
| **Church logo**      | Bottom-right corner, low opacity (10%), with continuous hue-rotation animation (20s cycle) — subtle visual flourish. Configurable in admin.                                   |
| **Heartbeat dot**    | Tiny circle in bottom-left corner — **green** = connected to Supabase Realtime, **orange** = disconnected / stale data. Always visible.                                       |
| **Version label**    | Small text next to heartbeat dot showing app version (e.g., `v2.0.0`). Useful for debugging which version a room is running.                                                  |
| **"ON-GOING" label** | When room is occupied, an `ON-GOING` label appears above the event name with a **flicker/blink animation** to draw attention. Hidden when available.                          |
| **Background**       | Rotating background images (4 images cycling via CSS animation, ~300s loop) with a dark semi-transparent overlay for text readability. Images configurable per room in admin. |

**Door-side layout** (`door_side: 'L' | 'R'`):

Each room has a configurable `door_side` setting — which side of the monitor the door is on. The layout mirrors accordingly so that the **room name faces the approaching person** (closest to the door) and the **clock is on the far side**:

| `door_side` | Room name position | Clock position |
| ----------- | ------------------ | -------------- |
| `'L'`       | Left-aligned       | Right side     |
| `'R'`       | Right-aligned      | Left side      |

This is carried over from the legacy DRS — it ensures the most important info (room name + status) is visible first as someone walks up to the door.

**Visual states**:

| State             | Background                                  | Badge                                        | When                                      |
| ----------------- | ------------------------------------------- | -------------------------------------------- | ----------------------------------------- |
| **Available**     | Soft green gradient or green-accented white | Green `AVAILABLE`                            | No active reservation now                 |
| **Occupied**      | Soft red gradient or red-accented white     | Red `OCCUPIED` + flickering `ON-GOING` label | Active reservation right now              |
| **Starting Soon** | Soft amber gradient                         | Amber `RESERVED IN 15 MIN`                   | Next reservation starts within 15 minutes |

**Real-time updates**:

- Subscribes to `venue_reservations` table changes via **Supabase Realtime**, filtered to the specific room
- Status updates **instantly** when a reservation starts, ends, is cancelled, or is created
- No polling — WebSocket connection stays open
- Auto-reconnects if connection drops (with visual indicator during reconnection)

**Kiosk optimizations**:

- **No scrolling** — everything fits on one screen
- **Large text** — readable from 3-5 meters away
- **High contrast** — works in bright hallways
- **No UI chrome** — no header, sidebar, breadcrumbs, or navigation
- **Auto-refresh fallback** — if Realtime connection is lost for >60 seconds, falls back to page reload every 30 seconds
- **Wake lock** — prevents screen from sleeping (via Screen Wake Lock API)
- **Dark mode** — follows system preference or admin setting per room
- **Landscape orientation** — designed for horizontal monitors

#### Signage Admin (`/admin/settings/signage`)

Admin page for managing room signage displays:

- **Room list**: All 13 rooms with their signage URLs, online/offline status, last seen timestamp
- **Per-room config**: Room name, door side (`L`/`R` — which side the door is relative to the monitor), display theme (light/dark), logo toggle, background images (upload up to 4), status message overrides
- **Generate URL**: Copy the signage URL for a room (for pasting into kiosk browser)
- **QR code**: Generate a QR code for the signage URL (for easy setup on a new device)
- **Preview**: Live preview of what the signage looks like for any room
- **Health monitoring**: Shows which signage displays are currently connected (via Realtime presence) — if a display goes offline, flag it
- **Override message**: Push an emergency or custom message to all or specific room displays (e.g., "Building closed today")

### Meal Stub QR Scanner

Replaces the legacy **CloudQR** app (CodeIgniter 4 + Instascan.js). The legacy app was a basic prototype — camera-based QR scanner with hardcoded auth, no scan logging, no backend processing. The new system is a full meal management workflow.

**Legacy approach** (what we're replacing):

- Separate CodeIgniter 4 app (`cloudqr`)
- Hardcoded login (ID `100`, plaintext password)
- Instascan.js camera scanner — reads QR but only displays raw text, no processing
- No scan logging, no redemption tracking, no canteen identification
- No double-scan prevention
- Checker page was a stub with no functionality

**New approach**:

- Integrated into the COG App meals module
- Workers already have QR codes on their worker profile (stored in `workers.qr_data`)
- Canteen stations use any device with a camera (phone, tablet, laptop) — no dedicated app install needed
- Each scan station is tied to a **canteen/tent location** (multi-tenant per event)
- Full scan logging, real-time dashboards, and double-redemption prevention

#### Meal Events & Stubs

Meals are organized around **meal events** — a meal event represents a specific meal occasion (e.g., "Saturday Lunch — Workers' Convention 2026").

**Meal event**:

- Name, date, meal type (breakfast/lunch/dinner/snack)
- Associated event or activity (optional)
- List of eligible workers (all workers, or filtered by org node / ministry / role)
- Number of canteen stations/tents
- Status: `draft` → `open` → `closed` → `archived`

**Meal stubs**:

- Auto-generated for each eligible worker when a meal event is opened
- Each stub is a unique record linking a worker to a meal event
- Status: `available` → `redeemed` → `cancelled`
- The worker's existing QR code (from their profile) is used for scanning — no separate meal QR needed

#### Scanner Page (`/meals/scan`)

A **dedicated scan interface** optimized for canteen operators. Accessed via the main app (authenticated, requires `meals:scan` permission).

**Setup flow**:

1. Operator opens `/meals/scan`
2. Selects the active **meal event** from a dropdown (only `open` events shown)
3. Selects their **canteen station** (e.g., "Tent A", "Tent B", "Main Hall")
4. Scanner activates — ready to scan

**Scan interface**:

```
┌──────────────────────────────────────────┐
│  Meal Scanner                            │
│  Event: Saturday Lunch · Tent A          │
│─────────────────────────────────────────-│
│                                          │
│         ┌──────────────────┐             │
│         │                  │             │
│         │   📷 Camera      │             │
│         │   Viewfinder     │             │
│         │                  │             │
│         └──────────────────┘             │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  ✅ Juan Dela Cruz                 │  │
│  │  Worker #1042 · Music Ministry     │  │
│  │  Redeemed at 12:03 PM             │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Recent scans:                           │
│  12:03 PM  Juan Dela Cruz    ✅          │
│  12:02 PM  Maria Santos      ✅          │
│  12:01 PM  Pedro Garcia      ⚠️ DOUBLE  │
│  11:59 AM  Ana Reyes         ✅          │
│                                          │
│  Stats: 142 / 500 redeemed              │
└──────────────────────────────────────────┘
```

**Scan behavior**:

| Scenario                      | Result                                              | Visual                                                           |
| ----------------------------- | --------------------------------------------------- | ---------------------------------------------------------------- |
| Valid QR, first scan          | Stub marked `redeemed`, records canteen + timestamp | Green flash + success sound + worker name                        |
| Valid QR, already redeemed    | Rejected — shows where/when previously redeemed     | Red flash + error sound + "Already redeemed at Tent B, 12:01 PM" |
| Valid QR, worker not eligible | Rejected — worker not in eligible list              | Orange flash + "Not eligible for this meal event"                |
| Invalid / unrecognized QR     | Rejected                                            | Red flash + "Invalid QR code"                                    |
| No active meal event          | Scanner disabled                                    | "No active meal event selected"                                  |

**Technical**:

- Uses `html5-qrcode` library (already in tech stack) — works on any device with camera access
- Continuous scanning mode — no tap-to-scan, just point the camera
- Scan debounce: 3-second cooldown after each scan to prevent rapid double-scans
- Works offline: if connection drops, queues scans locally and syncs when reconnected
- Audio feedback: distinct success/error sounds (configurable, can be muted)

#### Checker Page (`/meals/check`)

A **lookup tool** for supervisors — manually check a worker's meal stub status without scanning.

- Search by worker name, worker number, or QR data
- Shows all meal events and their stub status for that worker
- Can manually mark a stub as redeemed (with reason) — for cases where scanner fails
- Can cancel/void a redemption (with reason, audit logged)

#### Meal Dashboard (`/meals`)

Real-time overview of meal operations for the selected meal event.

**Dashboard cards**:

- **Total eligible**: Number of workers with stubs for this event
- **Redeemed**: Count + percentage (live-updating via Supabase Realtime)
- **Remaining**: Count of unredeemed stubs
- **By canteen**: Breakdown per canteen station (e.g., Tent A: 85, Tent B: 57)

**Dashboard components**:

- **Live counter**: Large number showing redeemed count, updates in real-time as scans happen
- **Redemption rate chart**: Line chart showing scans over time (e.g., scans per minute)
- **Canteen comparison**: Bar chart comparing throughput across canteen stations
- **Recent activity feed**: Live stream of scans as they happen (worker name, canteen, timestamp)
- **Unredeemed list**: Table of workers who haven't redeemed yet — filterable by org node, searchable

#### Meal Admin (`/meals/admin`)

Admin page for managing meal events and configuration.

- **Meal events list**: All events with status, dates, redemption stats
- **Create meal event**: Name, date, meal type, eligible workers filter, number of canteens
- **Canteen stations**: Define canteen stations/tents — each gets an ID used during scanning
- **Reports**: Export redemption data (CSV/Excel) — who ate, where, when
- **Bulk operations**: Open/close meal events, generate eligibility lists

#### Database Schema (Meal Stubs)

```sql
-- Meal events
CREATE TABLE meal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  related_event_id UUID REFERENCES events(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed', 'archived')),
  eligibility_filter JSONB DEFAULT '{}',  -- e.g., {"org_node_ids": [...], "role_ids": [...]}
  total_eligible INT DEFAULT 0,
  total_redeemed INT DEFAULT 0,
  created_by UUID REFERENCES workers(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Canteen stations
CREATE TABLE canteen_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,            -- e.g., "Tent A", "Main Hall"
  code TEXT NOT NULL UNIQUE,     -- short code for display
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meal stubs (one per worker per meal event)
CREATE TABLE meal_stubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_event_id UUID NOT NULL REFERENCES meal_events(id),
  worker_id UUID NOT NULL REFERENCES workers(id),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'redeemed', 'cancelled')),
  redeemed_at TIMESTAMPTZ,
  redeemed_by UUID REFERENCES workers(id),       -- the scanner operator
  canteen_station_id UUID REFERENCES canteen_stations(id),
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES workers(id),
  cancel_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meal_event_id, worker_id)               -- one stub per worker per event
);

-- Scan log (audit trail of every scan attempt, including failures)
CREATE TABLE meal_scan_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_event_id UUID NOT NULL REFERENCES meal_events(id),
  canteen_station_id UUID NOT NULL REFERENCES canteen_stations(id),
  scanned_qr TEXT NOT NULL,
  worker_id UUID REFERENCES workers(id),          -- NULL if QR not recognized
  result TEXT NOT NULL CHECK (result IN ('success', 'already_redeemed', 'not_eligible', 'invalid_qr')),
  scanned_by UUID NOT NULL REFERENCES workers(id),
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Design System

Based on the **Minia Admin Template v2.4.0** (Themesbrand). Replicate its look and feel using Tailwind CSS + shadcn/ui — do NOT use Bootstrap. Translate the Minia design tokens into Tailwind config and shadcn/ui theme overrides.

**Reference**: `/Users/jeromepacleb/Downloads/Minia_HTML_v2.4.0/HTML/dist/`

### Color Palette

Minia uses a custom Bootstrap theme with these exact values. Map them to Tailwind CSS and shadcn/ui CSS variables:

| Token                 | Hex       | Usage                                                            |
| --------------------- | --------- | ---------------------------------------------------------------- |
| **Primary**           | `#5156be` | Buttons, links, active states, sidebar active, alert card accent |
| **Secondary**         | `#74788d` | Muted text, secondary buttons, disabled states                   |
| **Success**           | `#2ab57d` | Success states, positive indicators                              |
| **Info**              | `#4ba6ef` | Informational badges, links                                      |
| **Warning**           | `#ffbf53` | Warning states, pending indicators                               |
| **Danger**            | `#fd625e` | Error states, destructive actions, delete buttons                |
| **Body BG (light)**   | `#fff`    | Main background                                                  |
| **Body BG (dark)**    | `#313533` | Dark mode background                                             |
| **Body Text (light)** | `#313533` | Primary text color                                               |
| **Body Text (dark)**  | `#adb5bd` | Dark mode text                                                   |
| **Gray 100**          | `#f8f9fa` | Subtle backgrounds, hover states                                 |
| **Gray 200**          | `#e9e9ef` | Borders, dividers, light badge bg                                |
| **Gray 300**          | `#f6f6f6` | Card backgrounds in light mode                                   |
| **Gray 400**          | `#ced4da` | Input borders                                                    |
| **Gray 500**          | `#adb5bd` | Placeholder text                                                 |
| **Gray 600**          | `#74788d` | Muted text, icon colors                                          |
| **Gray 700**          | `#313533` | Dark mode secondary bg                                           |
| **Gray 800**          | `#2c302e` | Dark mode card bg                                                |
| **Gray 900**          | `#212529` | Darkest elements                                                 |
| **Border (light)**    | `#e9e9ef` | Default border color                                             |
| **Border (dark)**     | `#383d3b` | Dark mode borders                                                |

#### Soft/Subtle Variants

Each theme color has a subtle background variant for badges, alerts, and soft buttons:

| Token     | Subtle BG | Subtle Border |
| --------- | --------- | ------------- |
| Primary   | `#b9bbe5` | `#b9bbe5`     |
| Secondary | `#c7c9d1` | `#c7c9d1`     |
| Success   | `#aae1cb` | `#aae1cb`     |
| Info      | `#b7dbf9` | `#b7dbf9`     |
| Warning   | `#ffe5ba` | `#ffe5ba`     |
| Danger    | `#fec0bf` | `#fec0bf`     |

### Typography

| Property            | Value                                                       |
| ------------------- | ----------------------------------------------------------- |
| Font Family         | `'IBM Plex Sans', sans-serif` (weights: 300, 400, 500, 600) |
| Body Font Size      | `0.875rem` (14px)                                           |
| Body Font Weight    | 400                                                         |
| Body Line Height    | 1.5                                                         |
| Heading Font Weight | 500                                                         |
| Heading Line Height | 1.2                                                         |
| Logo Text           | `font-weight: 700, font-size: 18px`                         |
| Page Title (h4)     | `font-size: 18px`                                           |
| Small Text          | `13px` (`.font-size-13`)                                    |
| Medium Text         | `14px` (`.font-size-14`)                                    |
| Regular Text        | `16px` (`.font-size-16`)                                    |
| h1                  | `2.1875rem` (35px at ≥1200px)                               |
| h2                  | `1.75rem` (28px at ≥1200px)                                 |

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER (fixed, 70px height, full width)                    │
│  [Logo 250px] [☰] [Search...] ····· [🔔] [🌙] [👤 Profile]  │
├──────────┬──────────────────────────────────────────────────┤
│ SIDEBAR  │  PAGE CONTENT                                    │
│ 250px    │  padding-top: calc(70px + 1.5rem)                │
│ fixed    │  padding-sides: calc(1.5rem × 0.75)              │
│          │  padding-bottom: 60px                             │
│ [Menu]   │                                                   │
│ [Menu]   │  ┌─ Breadcrumb ─────────────────────────┐        │
│ [▸ Sub]  │  │ Dashboard / Page Title                │        │
│ [Menu]   │  └──────────────────────────────────────┘        │
│          │                                                   │
│          │  ┌─ Card ─────────────────────────────┐          │
│          │  │ Card Header (title + actions)       │          │
│          │  │ Card Body (content)                 │          │
│          │  │ Card Footer                         │          │
│          │  └────────────────────────────────────┘          │
│          │                                                   │
│ Collapse │  ┌────────┐ ┌────────┐ ┌────────┐               │
│ to 70px  │  │ Stat   │ │ Stat   │ │ Stat   │               │
│          │  │ Card   │ │ Card   │ │ Card   │               │
│          │  └────────┘ └────────┘ └────────┘               │
│          ├──────────────────────────────────────────────────┤
│          │  FOOTER (60px height)                             │
└──────────┴──────────────────────────────────────────────────┘
```

- **Header**: Fixed at top, 70px, white bg (light) / dark bg (dark mode), border-bottom
- **Sidebar**: Fixed left, 250px wide, collapsible to 70px icon-only mode
- **Content**: Fluid container, responsive 12-column grid
- **Footer**: 60px, absolute bottom

### Sidebar Navigation

- Uses collapsible nested menu (up to 3 levels deep)
- Menu item padding: `0.62rem 1.5rem` (main), `0.4rem 3.3rem` (sub-items)
- Menu font size: `0.9rem` (main), `0.85rem` (sub-items)
- Menu item colors: `--bs-sidebar-menu-item-color` (normal), active state uses primary color (`#5156be`)
- Icons: Use Lucide icons (shadcn/ui default) — map to the Feather icon style from Minia
- Active state: highlighted with primary color, parent items auto-expand
- Sidebar bottom: optional alert/info card
- Mobile: sidebar hidden by default, toggled via hamburger menu, overlay behavior

### Breadcrumbs

Every page inside the authenticated layout shows a **breadcrumb bar** at the top of the content area (below the header, above the page title). Breadcrumbs provide context and quick navigation:

```
┌─────────────────────────────────────────────────────────┐
│  Dashboard  /  Service Requests  /  SR-2024-0451        │
│  ─────────     ────────────────     ───────────         │
│  (link)        (link)               (current, no link)  │
└─────────────────────────────────────────────────────────┘
```

**Implementation**:

- **Component**: `<Breadcrumb>` in `src/components/layout/Breadcrumb.tsx`
- **Data source**: Each page defines its breadcrumb trail via a `useBreadcrumbs()` hook or a `breadcrumbs` prop passed to the `<PageHeader>` component
- **Auto-generation**: The breadcrumb auto-generates from the URL path segments by default (e.g., `/venues/reservations/123` → `Dashboard / Venues / Reservations / #123`). Pages can override with custom labels.
- **Module-aware**: Module pages use the module's display name from the registry (not the URL slug)
- **Styling**: Text size `0.8125rem`, separator `/` in `text-muted`, links in muted color, current page in `text-foreground` (not a link)
- **Mobile**: Collapses to show only the parent link + current page (e.g., `← Service Requests` as a back link)

### Header / Topbar

The header is the primary navigation bar — fixed at top, 70px height, full width.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Logo 250px] [☰]  [🔍 Search everything... ___________]  ···  [🔔 3] [🌙] [👤]  │
└──────────────────────────────────────────────────────────────────────────┘
│← logo area →│     │← global search (expands) →│         │← right icons →│
```

**Left side**: Logo box (250px, matches sidebar width) + sidebar toggle button (hamburger `☰`)
**Center**: Global search bar (see [Global Search](#global-search) below)
**Right side**: Notification bell with badge + dark/light mode toggle + user profile dropdown

- Profile dropdown: avatar, full name, org position title, links to Profile / Settings / Delegations / Logout

### Global Search

A **command-palette-style** global search accessible from the header. Searches across all modules the user has access to — workers, requests, venues, records, pages, and actions.

**Trigger**:

- Click the search bar in the header
- Keyboard shortcut: `⌘K` (Mac) / `Ctrl+K` (Windows/Linux)
- Both open a centered **search modal/dialog** (command palette style, like VS Code's `⌘P`)

**Search modal layout**:

```
┌───────────────────────────────────────────────────┐
│  🔍  Search everything...                    [ESC] │
├───────────────────────────────────────────────────┤
│  RECENT                                           │
│  🕐 Service Request SR-2024-0451                  │
│  🕐 John Smith (Worker #1234)                     │
│                                                   │
│  WORKERS                                (3 results)│
│  👤 John Smith — Worship / Music Ministry          │
│  👤 John Santos — Admin / Finance Section          │
│  👤 Johnny Cruz — Outreach / Evangelism Ministry    │
│                                                   │
│  SERVICE REQUESTS                       (1 result) │
│  📋 SR-2024-0451 — Equipment repair                │
│                                                   │
│  PAGES                                  (2 results)│
│  📄 Venue Reservations                             │
│  📄 Venue Management                               │
│                                                   │
│  ↑↓ Navigate  ↵ Open  esc Close                   │
└───────────────────────────────────────────────────┘
```

**Search categories** (results grouped by type):

| Category               | What it searches                                     | Result display                    |
| ---------------------- | ---------------------------------------------------- | --------------------------------- |
| **Workers**            | Name, worker number, email, mobile                   | Name, worker number, org position |
| **Pages**              | All sidebar menu items (module pages)                | Page name, module                 |
| **Actions**            | Quick actions ("Create venue request", "Add worker") | Action name, module               |
| **Service Requests**   | SR number, title, description                        | SR number, title, status badge    |
| **Venue Reservations** | Reservation number, venue name                       | Number, venue, date, status       |
| **Approvals**          | Pending approval summaries                           | Module, requester, status         |
| _(extensible)_         | Each module can register its own searchable entities | —                                 |

**Behavior**:

- **Debounced input**: 300ms debounce before querying
- **Recent searches**: Shows last 5 recent searches/selections when the modal opens (before typing)
- **Module-scoped**: Only shows results from modules the current worker has permission to access
- **Keyboard navigation**: Arrow keys to navigate, Enter to open, Escape to close
- **Category limits**: Show top 3 results per category, with a "View all N results" link per category
- **Empty state**: "No results found for '[query]'" with suggestions
- **Implementation**: `<GlobalSearch>` component in `src/components/layout/GlobalSearch.tsx`, using a Supabase full-text search function or a dedicated search Edge Function
- **Module registration**: Modules register their searchable entities via a `searchableEntities` config in their module definition:

```typescript
// In a module's config
export const venuesModule: ModuleConfig = {
  id: "venues",
  // ...
  searchableEntities: [
    {
      type: "venue_reservation",
      table: "venue_reservations",
      searchFields: ["reservation_number", "venue_name", "requester_name"],
      displayFields: ["reservation_number", "venue_name", "date", "status"],
      icon: "Calendar",
      route: (record) => `/venues/reservations/${record.id}`,
    },
  ],
};
```

### Notification Center

The notification bell icon (`🔔`) in the top-right header is the entry point to the **Notification Center**. It provides real-time, cross-module notifications.

**Bell icon**:

- Shows an **unread count badge** (red circle with number, max "99+")
- Clicking opens a **notification dropdown panel** (not a full page)
- Badge disappears when all notifications are read

**Notification dropdown**:

```
┌───────────────────────────────────────────────┐
│  Notifications                   [Mark all read] │
├───────────────────────────────────────────────┤
│  🔵 Your venue request was approved            │
│     Venue Reservations · 2 min ago             │
│  ─────────────────────────────────────────     │
│  🔵 New approval pending: SR-2024-0451         │
│     Approvals · 15 min ago                     │
│  ─────────────────────────────────────────     │
│  ⚪ Worker transfer completed                   │
│     Workers · 1 hour ago                       │
│  ─────────────────────────────────────────     │
│  ⚪ Training session reminder: tomorrow 9am     │
│     Training · 3 hours ago                     │
├───────────────────────────────────────────────┤
│              View All Notifications →          │
└───────────────────────────────────────────────┘
```

**Dropdown specs**:

- **Max height**: 400px, scrollable
- **Shows**: Last 10 notifications, sorted newest first
- **Unread indicator**: Blue dot (🔵) for unread, gray (⚪) for read
- **Each item**: Title, module name, relative timestamp ("2 min ago"), clickable → navigates to the relevant record
- **Mark all read**: Button in header clears all unread indicators
- **"View All" link**: Opens the full notifications page (`/notifications`)

**Full notifications page** (`/notifications`):

- All notifications, paginated (infinite scroll or pagination)
- **Filters**: All | Unread | By Module | By Type (Approval, System, Reminder)
- **Bulk actions**: Mark selected as read, delete selected
- **Notification preferences link**: Opens settings to configure which notifications to receive

**Notification types**:

| Type         | Source                     | Examples                                                                           |
| ------------ | -------------------------- | ---------------------------------------------------------------------------------- |
| **Approval** | Approval Workflow Engine   | "New approval pending", "Your request was approved/rejected", "Approval escalated" |
| **System**   | Admin actions, cron jobs   | "Worker profile updated", "Account deactivated (90-day rule)"                      |
| **Reminder** | Scheduled events           | "Training session tomorrow", "Reservation starts in 1 hour"                        |
| **Mention**  | Future: comments/messaging | "@you was mentioned in a comment"                                                  |

**Real-time delivery**:

- **Supabase Realtime**: Subscribes to the `notifications` table for the current worker. New rows trigger an instant UI update (badge count increments, toast appears).
- **Toast**: When a new notification arrives while the app is open, show a brief toast in the bottom-right (auto-dismiss after 5s, clickable)
- **Browser push**: FCM service worker shows OS-level notifications when the tab is not focused
- **Sound**: Optional subtle notification sound (configurable in user preferences)

**Database**:

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id),  -- recipient
  type TEXT NOT NULL,                               -- 'approval', 'system', 'reminder', 'mention'
  title TEXT NOT NULL,                               -- 'Your venue request was approved'
  body TEXT,                                         -- optional longer description
  module_id TEXT,                                    -- which module generated this
  link TEXT,                                         -- deep link path (e.g., '/venues/reservations/uuid')
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_worker_unread
  ON notifications (worker_id, is_read)
  WHERE is_read = FALSE;
```

**Notification preferences** (per worker, in `/profile/settings`):

- Toggle notifications on/off per type (approval, system, reminder)
- Toggle delivery channels per type (in-app, email, push)
- Quiet hours: suppress push/email during specified hours

### Dark Mode

- Toggled via `data-bs-theme="dark"` attribute
- Sun/moon icon toggle in header
- All colors switch via CSS variables
- Dark mode body: `#313533`, cards: `#2c302e`, borders: `#383d3b`, text: `#adb5bd`

### Component Patterns

#### Cards

- White background, subtle border, optional header/footer
- `.card-title` for heading, `.card-title-desc` for subtitle
- Used as the primary content container for every section

#### Buttons

- Primary solid: `#5156be` bg, white text
- All variant colors available (success, danger, warning, info, secondary, light)
- Soft/outline variants for secondary actions
- Small (`.btn-sm`) and default sizes
- Wave/ripple animation on click

#### Badges

- Solid: colored background with white text
- Soft: subtle/pastel background with colored text (e.g., `badge-soft-danger`)
- Pill shape variant (`.rounded-pill`)

#### Forms

- Labels above inputs (`.form-label`)
- Standard input height ~38px, subtle border (`#ced4da`)
- Input groups with addons (icons, buttons)
- Checkboxes and radios with custom styling
- Form validation states (success/error borders + messages)

#### Tables

- Responsive wrapper
- Striped/hover variants
- Used inside cards
- Support for DataTable-style search, sort, pagination

#### Modals

- Centered or top-aligned
- Header with title + close button, body, footer with action buttons
- Backdrop overlay

#### Alerts

- Colored left-border variant (primary accent bar)
- Soft background variants
- Dismissible with close button

#### Breadcrumbs

- Page title bar with breadcrumb trail
- Located at top of content area, inside page-title-box

### Auth Pages (Login, Register, etc.)

- **Full-page layout** (no sidebar/header)
- **Split layout**: Left column (form) — `col-xxl-3 col-lg-4 col-md-5` | Right column (decorative carousel) — remaining width
- Left panel: centered vertically, contains logo, welcome text, form fields, submit button, social login options, footer links
- Right panel: primary color background (`#5156be`) with carousel of feature descriptions + illustration images
- Consistent across login, register, forgot password, lock screen, 2FA, email verification pages

### Responsive Breakpoints

| Breakpoint | Width   | Behavior                              |
| ---------- | ------- | ------------------------------------- |
| XS         | <576px  | Full-width everything, sidebar hidden |
| SM         | ≥576px  | Slight padding increase               |
| MD         | ≥768px  | Auth page shows left column at 5/12   |
| LG         | ≥992px  | Sidebar visible, desktop search shows |
| XL         | ≥1200px | Full desktop layout                   |
| XXL        | ≥1400px | Auth page left column at 3/12         |

### Icon System

- Minia uses **Feather Icons** (line-style) and **Material Design Icons (MDI)**
- In COG App, use **Lucide React** (Feather-compatible, shadcn/ui default) as the primary icon library
- Maintain the same line-style aesthetic — avoid filled/solid icons

---

## Organizational Structure

COG App serves **~6,000 workers** in a church organization. The org structure is the foundation that every module depends on — reporting, data scoping, approvals, and access control all flow through it.

### Design: Generic Org Tree

Instead of hardcoded tables per hierarchy level, the org structure uses a **fully configurable, generic tree**:

1. **`org_node_types`** — Defines the vocabulary of level names (Department, Ministry, Section, Unit, or anything you want)
2. **`org_nodes`** — The actual tree of organizational units, each with a type and a parent pointer

This means:

- **Rename** any group label (e.g., "Ministry" → "Team", "Section" → "Division") — just edit the node type name
- **Add new levels** (e.g., "Sub-Unit" below Unit, or "Region" above Department) — create a new node type and insert nodes
- **Different branch depths** per department (WORD depts: 2 levels, Admin: 3 levels, future depts: any depth) — it's all just nodes in a tree
- **No schema changes or code changes** needed for any of the above — it's all configuration

### Current Structure (Initial Config)

The system ships with the WORDA structure pre-configured as data — not hardcoded in schema:

```
Organization (root)
├── Worship (Department)
│   ├── Music Ministry (Ministry)
│   ├── Sound Ministry (Ministry)
│   └── ...
├── Outreach (Department)
│   ├── Evangelism Ministry (Ministry)
│   └── ...
├── Relationship (Department)
│   ├── Fellowship Ministry (Ministry)
│   └── ...
├── Discipleship (Department)
│   ├── Bible Study Ministry (Ministry)
│   └── ...
└── Administration (Department)
    ├── Finance Section (Section)
    │   ├── Accounts Unit (Unit)
    │   └── Budget Unit (Unit)
    ├── HR Section (Section)
    │   ├── Recruitment Unit (Unit)
    │   └── ...
    └── IT Section (Section)
        └── ...
```

The key difference from the previous design: **this is configuration, not schema**. If tomorrow:

- You want to rename "Ministry" to "Team" → update the node type
- You need a "Region" level above Department → add a node type and restructure nodes
- A department wants sub-ministries → add a "Sub-Ministry" node type and nest nodes
- You split Administration into two departments → create new department nodes and reparent children

All of this is done through the admin UI or a migration script — zero code changes.

### Database Schema

```sql
-- Configurable org level types (the vocabulary of hierarchy levels)
CREATE TABLE org_node_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                -- 'Department', 'Ministry', 'Section', 'Unit'
  slug TEXT NOT NULL UNIQUE,         -- 'department', 'ministry', 'section', 'unit'
  description TEXT,                  -- optional description for admins
  sort_order INT NOT NULL DEFAULT 0, -- controls display ordering in admin UI
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- The org tree (self-referencing hierarchy — unlimited depth)
CREATE TABLE org_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                            -- 'Worship', 'Music Ministry', 'Finance Section'
  node_type_id UUID NOT NULL REFERENCES org_node_types(id),
  parent_id UUID REFERENCES org_nodes(id),       -- NULL = root node
  head_worker_id UUID REFERENCES workers(id),    -- the head/leader of this node
  code TEXT,                                     -- optional short code ('W', 'O', 'R', 'D', 'A')
  depth INT NOT NULL DEFAULT 0,                  -- denormalized: auto-set from parent.depth + 1
  materialized_path TEXT NOT NULL DEFAULT '',     -- e.g., 'root-id/dept-id/ministry-id' for fast subtree queries
  status TEXT NOT NULL DEFAULT 'Active',          -- Active, Inactive
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_org_nodes_parent ON org_nodes (parent_id);
CREATE INDEX idx_org_nodes_type ON org_nodes (node_type_id);
CREATE INDEX idx_org_nodes_path ON org_nodes USING GIN (materialized_path gin_trgm_ops);
CREATE INDEX idx_org_nodes_head ON org_nodes (head_worker_id) WHERE head_worker_id IS NOT NULL;

-- Auto-maintain depth and materialized_path on insert/update
CREATE OR REPLACE FUNCTION update_org_node_path() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.depth := 0;
    NEW.materialized_path := NEW.id::TEXT;
  ELSE
    SELECT depth + 1, materialized_path || '/' || NEW.id::TEXT
    INTO NEW.depth, NEW.materialized_path
    FROM org_nodes WHERE id = NEW.parent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_org_node_path
  BEFORE INSERT OR UPDATE OF parent_id ON org_nodes
  FOR EACH ROW EXECUTE FUNCTION update_org_node_path();

-- Workers (the central entity — ~6,000 records)
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_number INT NOT NULL UNIQUE,         -- legacy worker ID (used for login)
  auth_user_id UUID UNIQUE REFERENCES auth.users(id), -- Supabase Auth link

  -- Personal info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  mobile TEXT,
  address TEXT,
  birthdate DATE,

  -- Organizational assignment (generic — works with any tree structure)
  org_node_id UUID REFERENCES org_nodes(id),           -- primary assignment (any level)
  secondary_org_node_id UUID REFERENCES org_nodes(id),  -- optional second assignment

  -- Special flag (only one worker has this)
  is_senior_pastor BOOLEAN NOT NULL DEFAULT FALSE,

  -- Worker classification
  worker_type TEXT NOT NULL DEFAULT 'Volunteer',   -- Full-time, Part-time, Volunteer, Intern
  worker_status TEXT NOT NULL DEFAULT 'Active',     -- Active, Inactive, Pending
  status TEXT NOT NULL DEFAULT 'Active',            -- System status (Active, Deactivated)

  -- QR / ID
  qr_data TEXT,
  biometrics_id INT,

  -- Dates
  start_month TEXT,
  start_year TEXT,
  last_password_change_date TIMESTAMPTZ,

  -- Audit
  created_by UUID REFERENCES workers(id),
  updated_by UUID REFERENCES workers(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  remarks TEXT
);
```

### How Leadership Works

Leadership is determined by the `head_worker_id` field on `org_nodes` — **not** by boolean flags on the worker:

```sql
-- Is this worker a head of any org node?
SELECT n.id, n.name, t.name AS level_name
FROM org_nodes n
JOIN org_node_types t ON n.node_type_id = t.id
WHERE n.head_worker_id = :worker_id;

-- Result examples:
-- { name: 'Worship', level_name: 'Department' }     → this worker is a Department Head
-- { name: 'Music Ministry', level_name: 'Ministry' } → this worker is a Ministry Head
```

A worker's **leadership title** is derived dynamically: if you head a "Department" node, you're a "Department Head". If you head a "Team" node (after renaming), you're a "Team Head". No hardcoded title mapping needed.

**Senior Pastor** is the exception — flagged directly on the worker via `is_senior_pastor` since they sit above the entire tree and don't head a specific node.

### Finding a Worker's Superior

The approval chain and reporting line are derived by **walking up the tree**:

```sql
-- Find the direct superior of a worker
CREATE OR REPLACE FUNCTION get_direct_superior(p_worker_id UUID)
RETURNS UUID AS $$
DECLARE
  v_org_node_id UUID;
  v_head_worker_id UUID;
  v_parent_id UUID;
BEGIN
  -- Get the worker's assigned org node
  SELECT org_node_id INTO v_org_node_id FROM workers WHERE id = p_worker_id;

  -- Get the head of that node
  SELECT head_worker_id, parent_id INTO v_head_worker_id, v_parent_id
  FROM org_nodes WHERE id = v_org_node_id;

  -- If the worker IS the head, go up to the parent node's head
  IF v_head_worker_id = p_worker_id THEN
    LOOP
      SELECT head_worker_id, parent_id INTO v_head_worker_id, v_parent_id
      FROM org_nodes WHERE id = v_parent_id;

      EXIT WHEN v_head_worker_id IS NOT NULL AND v_head_worker_id != p_worker_id;
      EXIT WHEN v_parent_id IS NULL; -- reached root
    END LOOP;
  END IF;

  -- If no head found, fall back to Senior Pastor
  IF v_head_worker_id IS NULL OR v_head_worker_id = p_worker_id THEN
    SELECT id INTO v_head_worker_id FROM workers WHERE is_senior_pastor = TRUE LIMIT 1;
  END IF;

  RETURN v_head_worker_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

This works regardless of how many levels exist. Adding a new level in the middle automatically inserts it into the approval chain — no code changes.

### Org-Scoped Data Access

Data scoping is based on the tree. A worker can see data for all workers in their **subtree**:

| Position                | Data Scope                                                        |
| ----------------------- | ----------------------------------------------------------------- |
| **Senior Pastor**       | All data across the entire org tree                               |
| **Head of any node**    | All data in that node and all its descendants (entire subtree)    |
| **Worker (not a head)** | Own data only (unless explicitly granted broader access via RBAC) |

This is enforced via RLS using the `materialized_path` for efficient subtree matching:

```sql
-- Returns all org_node IDs the current worker can see
CREATE OR REPLACE FUNCTION get_visible_org_nodes()
RETURNS SETOF UUID AS $$
DECLARE
  v_worker_id UUID;
  v_is_senior_pastor BOOLEAN;
BEGIN
  SELECT w.id, w.is_senior_pastor INTO v_worker_id, v_is_senior_pastor
  FROM workers w WHERE w.auth_user_id = auth.uid();

  -- Senior Pastor sees everything
  IF v_is_senior_pastor THEN
    RETURN QUERY SELECT id FROM org_nodes;
    RETURN;
  END IF;

  -- Return nodes where this worker is head (plus all descendants)
  RETURN QUERY
    SELECT descendant.id
    FROM org_nodes headed
    JOIN org_nodes descendant
      ON descendant.materialized_path LIKE headed.materialized_path || '%'
    WHERE headed.head_worker_id = v_worker_id

    UNION

    -- Plus the worker's own assigned node
    SELECT org_node_id FROM workers WHERE id = v_worker_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Assignment Rules

- Every worker is assigned to **one primary org node** via `org_node_id` — this can be any level in the tree (ministry, section, unit, or any future level)
- A worker may optionally have a **secondary assignment** via `secondary_org_node_id` (legacy `sec_ministry_id` — keeps this capability)
- **Node heads** are assigned at the node they lead — they are NOT assigned to a child node
- **Senior Pastor** may or may not be assigned to a node — the `is_senior_pastor` flag gives them full access regardless

### Worker Admin UI

The Workers module must provide a full-blown worker management interface:

- **Worker list**: Filterable by node type, specific node, status, worker type. Default view: org tree with expandable nodes
- **Worker detail**: Full profile with org assignment, leadership positions (derived from `head_worker_id`), roles, activity history
- **Org chart view**: Visual tree of the entire org hierarchy — automatically adapts to whatever levels exist
- **Bulk operations**: Assign workers to org nodes, change status, bulk role assignment
- **Worker profile card**: Photo, name, worker number, org position (auto-generated title like "Ministry Head — Music Ministry"), contact info, QR code
- **Transfer**: Move a worker between org nodes with proper audit trail

### Admin: Org Structure Configuration

Admins can manage the org structure via the admin UI (`/admin/settings/org-structure`):

- **Node Types**: Add, rename, reorder node types (e.g., rename "Ministry" to "Team", add "Sub-Unit")
- **Org Tree**: Visual tree editor — add, rename, move, deactivate nodes. Drag-and-drop reparenting.
- **Assign Heads**: Set or change the head worker for any node
- **Audit trail**: Track all structural changes (who moved what, when)
- **Validation**: Warn when reparenting would create orphaned workers or break active approval workflows

---

## Approval Workflow Engine

The approval workflow is a **core shared engine** — not a module-specific feature. It lives in `src/lib/approvals/` and provides a fully customizable, reusable approval system that any module can plug into. Admins can build, modify, and manage approval flows entirely through the UI — **zero code changes** for any workflow customization.

### Design Principles

1. **Fully admin-configurable**: Every aspect of a workflow — steps, approvers, conditions, timeouts, actions — is editable through the admin UI. No developer involvement needed to change approval flows.
2. **Module-agnostic**: The engine knows nothing about venues, service requests, or any specific domain. Modules plug in via a simple API.
3. **Org-tree-aware**: Resolvers walk the generic org tree — they work with any number of levels and adapt automatically when the org structure changes.
4. **Versionable**: Template changes don't affect in-flight workflows. Active instances run on the version they started with.
5. **Auditable**: Every action, delegation, escalation, and configuration change is logged.

### Core Concepts

| Concept               | Description                                                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Workflow Template** | A named, reusable, versioned approval flow definition (e.g., "Venue Reservation Approval")                                       |
| **Version**           | An immutable snapshot of a template's steps and config. Active instances are pinned to a version. Editing creates a new version. |
| **Step**              | One stage in a workflow — defines who should approve, in what order, and under what conditions                                   |
| **Step Mode**         | How a step processes approvers: `sequential` (one approver), `any_one` (first of N to act), `all_must` (unanimous)               |
| **Resolver**          | How the approver(s) are determined: org hierarchy, role, specific worker, or custom function                                     |
| **Condition**         | A rule that controls flow: skip a step, add a step, or branch based on request metadata                                          |
| **Instance**          | A running workflow tied to a specific request — pinned to a template version                                                     |
| **Action**            | What an approver can do: **Approve**, **Reject**, **Return** (send back), **Reassign**, **Delegate**                             |
| **Escalation Rule**   | Auto-action when an approver doesn't respond within a deadline (escalate, auto-approve, notify)                                  |
| **Delegation**        | An approver can pre-delegate their approval authority to another worker (e.g., while on leave)                                   |
| **Hook**              | Callback that fires on workflow events — lets modules react to approvals/rejections                                              |

### Database Schema

```sql
-- ==========================================
-- WORKFLOW TEMPLATES & VERSIONING
-- ==========================================

-- Workflow Templates (top-level definition)
CREATE TABLE approval_workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL,                   -- which module ('venues', 'service_requests', etc.)
  name TEXT NOT NULL,                        -- 'Venue Reservation Approval'
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  current_version INT NOT NULL DEFAULT 1,    -- latest published version number
  created_by UUID REFERENCES workers(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template Versions (immutable snapshots — editing creates a new version)
CREATE TABLE approval_workflow_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES approval_workflow_templates(id) ON DELETE CASCADE,
  version_number INT NOT NULL,               -- 1, 2, 3...
  published_at TIMESTAMPTZ DEFAULT NOW(),
  published_by UUID REFERENCES workers(id),
  change_notes TEXT,                         -- "Added Finance Head step for amounts > 10k"
  is_draft BOOLEAN NOT NULL DEFAULT FALSE,   -- TRUE while being edited, FALSE when published

  UNIQUE(template_id, version_number)
);

-- ==========================================
-- WORKFLOW STEPS (per version)
-- ==========================================

CREATE TABLE approval_workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES approval_workflow_versions(id) ON DELETE CASCADE,
  step_order INT NOT NULL,                   -- 1, 2, 3...
  name TEXT NOT NULL,                        -- 'Ministry Head Review'

  -- Resolver (who approves)
  resolver_type TEXT NOT NULL,               -- 'direct_superior', 'node_type_head', 'levels_up',
                                             -- 'senior_pastor', 'specific_role', 'specific_worker', 'custom'
  resolver_config JSONB NOT NULL DEFAULT '{}',

  -- Step mode (how multiple approvers are handled)
  step_mode TEXT NOT NULL DEFAULT 'sequential', -- 'sequential': one resolved approver
                                                -- 'any_one': first of N resolved approvers to act
                                                -- 'all_must': ALL resolved approvers must approve (unanimous)

  -- Conditions (when to skip or require this step)
  skip_condition JSONB,                      -- condition to SKIP this step (see Condition Engine)
  require_condition JSONB,                   -- condition to REQUIRE this step (only runs if condition met)

  -- Escalation
  escalation_hours INT,                      -- hours before escalation triggers (NULL = no escalation)
  escalation_action TEXT,                    -- 'notify_again', 'escalate_up', 'auto_approve', 'auto_reject'
  escalation_notify_requester BOOLEAN DEFAULT FALSE, -- notify requester when escalation fires

  -- Step config
  is_optional BOOLEAN NOT NULL DEFAULT FALSE,
  allow_reassign BOOLEAN NOT NULL DEFAULT TRUE,  -- can the approver reassign to another worker?
  allow_return BOOLEAN NOT NULL DEFAULT TRUE,     -- can the approver return for revision?
  require_comments_on_reject BOOLEAN NOT NULL DEFAULT TRUE, -- must provide reason when rejecting
  custom_fields JSONB,                       -- additional fields the approver must fill (see Custom Fields)

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(version_id, step_order)
);

-- ==========================================
-- WORKFLOW INSTANCES (running workflows)
-- ==========================================

CREATE TABLE approval_workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES approval_workflow_templates(id),
  version_id UUID NOT NULL REFERENCES approval_workflow_versions(id),  -- pinned to version at start
  module_id TEXT NOT NULL,
  record_id UUID NOT NULL,                   -- the ID of the record being approved
  current_step_order INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',     -- 'pending', 'approved', 'rejected', 'returned', 'cancelled', 'recalled'
  requested_by UUID NOT NULL REFERENCES workers(id),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  recalled_at TIMESTAMPTZ,                   -- set when requester recalls the request
  metadata JSONB DEFAULT '{}',               -- module-specific context (amounts, categories, dates, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- APPROVAL ACTIONS (audit trail per step)
-- ==========================================

CREATE TABLE approval_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES approval_workflow_instances(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES approval_workflow_steps(id),
  step_order INT NOT NULL,
  action TEXT NOT NULL,                      -- 'approved', 'rejected', 'returned', 'reassigned',
                                             -- 'delegated', 'escalated', 'auto_approved', 'auto_rejected', 'recalled'
  acted_by UUID NOT NULL REFERENCES workers(id),
  delegated_from UUID REFERENCES workers(id), -- if this action was by a delegate, who was the original approver
  reassigned_to UUID REFERENCES workers(id),  -- if action is 'reassigned', the new approver
  comments TEXT,
  custom_field_values JSONB,                 -- values for any custom fields defined on the step
  acted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- DELEGATION (pre-set approval authority transfer)
-- ==========================================

CREATE TABLE approval_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_id UUID NOT NULL REFERENCES workers(id),   -- the original approver
  delegate_id UUID NOT NULL REFERENCES workers(id),     -- who receives authority
  module_id TEXT,                                        -- NULL = all modules, or scoped to one module
  template_id UUID REFERENCES approval_workflow_templates(id), -- NULL = all templates for the module
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  reason TEXT,                               -- 'On leave', 'Travel', etc.
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- HOOKS (module callbacks on workflow events)
-- ==========================================

CREATE TABLE approval_workflow_hooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES approval_workflow_versions(id) ON DELETE CASCADE,
  event TEXT NOT NULL,                       -- 'on_submit', 'on_step_approved', 'on_step_rejected',
                                             -- 'on_returned', 'on_fully_approved', 'on_fully_rejected',
                                             -- 'on_recalled', 'on_escalated'
  hook_type TEXT NOT NULL,                   -- 'status_update', 'notification', 'edge_function', 'field_update'
  hook_config JSONB NOT NULL DEFAULT '{}',   -- configuration for the hook (see Hooks section)
  step_id UUID REFERENCES approval_workflow_steps(id), -- NULL = fires for any step, or scoped to a specific step
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- AUTO-APPROVAL RULES
-- ==========================================

CREATE TABLE approval_auto_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES approval_workflow_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                        -- 'Auto-approve if amount < 1000'
  condition JSONB NOT NULL,                  -- condition to evaluate (same format as step conditions)
  action TEXT NOT NULL DEFAULT 'auto_approve', -- 'auto_approve', 'auto_reject', 'skip_workflow'
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,         -- evaluated in order, first match wins
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Resolver Types

Resolvers determine **who** should approve at each step. With the generic org tree, resolvers walk up `parent_id` pointers to find the right approver — they work with **any number of levels** automatically:

| Resolver          | Config                          | How It Works                                                                                                                              |
| ----------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `direct_superior` | `{}`                            | Walks up the org tree from the requester's node to find the nearest `head_worker_id`. Uses `get_direct_superior()` function.              |
| `node_type_head`  | `{ "node_type": "department" }` | Walks up the tree until it finds a node whose type matches the given slug, then returns that node's head. Works with any type name.       |
| `levels_up`       | `{ "levels": 2 }`               | Walks up N levels from the requester's node and returns that node's head. Level-agnostic — works regardless of what the levels are named. |
| `senior_pastor`   | `{}`                            | Routes directly to the Senior Pastor (via `is_senior_pastor` flag).                                                                       |
| `specific_role`   | `{ "role_id": "uuid" }`         | Any worker with the specified RBAC role can approve (e.g., "Finance Approver").                                                           |
| `specific_worker` | `{ "worker_id": "uuid" }`       | A specific named worker must approve.                                                                                                     |
| `custom`          | `{ "function": "name" }`        | Calls a custom resolver function (for complex cross-department or conditional logic).                                                     |

> **Why this is flexible**: If you rename "Ministry" to "Team" or add a new "Region" level above Department, `direct_superior` and `levels_up` work unchanged because they walk the tree structure. `node_type_head` resolves by the slug, which you control. No code changes needed.

### Org-Aware Approval Resolution

The resolver **walks the org tree** — it doesn't know or care about specific level names. The approval chain is determined entirely by the tree structure:

**Any worker — automatic chain via `direct_superior`**:

```
Worker → Head of assigned node → Head of parent node → ... → Senior Pastor
```

**Concrete example — WORD dept** (2 levels: Department → Ministry):

```
Worship Ministry Worker → Ministry Head → Department Head (Worship) → Senior Pastor
```

**Concrete example — Admin dept** (3 levels: Department → Section → Unit):

```
Admin Unit Worker → Unit Head → Section Head → Department Head (Admin) → Senior Pastor
```

**Concrete example — future "Region" level added** (4 levels: Region → Department → Ministry):

```
Ministry Worker → Ministry Head → Department Head → Region Head → Senior Pastor
```

All three examples use the **exact same resolver logic** (`direct_superior`) — the engine just walks up `parent_id` until it reaches the top. Adding the "Region" level required zero code changes.

### Example Workflow Templates

**Venue Reservation** (3 steps with conditions):
| Step | Name | Mode | Resolver | Condition / Notes |
| --- | --- | --- | --- | --- |
| 1 | Direct Superior Review | sequential | `direct_superior` | Always runs |
| 2 | Department Head Approval | sequential | `node_type_head: department` | Skip if `venue_type == 'small_room'` |
| 3 | Admin Head Final Approval | sequential | `specific_role: Admin Approver` | Only if `venue_type == 'main_hall'` |

Auto-rule: Skip entire workflow if `venue_type == 'open_area'` AND `duration_hours <= 1`.

**Service Request** (2 steps, multi-approver):
| Step | Name | Mode | Resolver | Condition / Notes |
| --- | --- | --- | --- | --- |
| 1 | Direct Superior Review | sequential | `direct_superior` | — |
| 2 | Admin Approval | any_one | `specific_role: Admin Approver` | Any one of the Admin Approvers can act |

**Purchase Request** (conditional depth):
| Step | Name | Mode | Resolver | Condition / Notes |
| --- | --- | --- | --- | --- |
| 1 | Direct Superior | sequential | `direct_superior` | — |
| 2 | Department Head | sequential | `node_type_head: department` | Skip if `amount < 5000` |
| 3 | Finance Review | all_must | `specific_role: Finance Approver` | Only if `amount >= 10000`. All finance approvers must agree. |
| 4 | Senior Pastor | sequential | `senior_pastor` | Only if `amount >= 50000` |

### Condition Engine

Conditions control whether a step is skipped, required, or whether an auto-rule fires. They evaluate against the **instance metadata** (the JSONB `metadata` field set by the module when starting the workflow).

**Condition format** (stored as JSONB):

```jsonc
// Simple condition
{ "field": "amount", "operator": "gte", "value": 10000 }

// AND — all must be true
{
  "and": [
    { "field": "amount", "operator": "gte", "value": 10000 },
    { "field": "category", "operator": "eq", "value": "equipment" }
  ]
}

// OR — any one must be true
{
  "or": [
    { "field": "venue_type", "operator": "eq", "value": "main_hall" },
    { "field": "expected_attendees", "operator": "gt", "value": 500 }
  ]
}

// Nested AND/OR
{
  "and": [
    { "field": "amount", "operator": "gte", "value": 5000 },
    {
      "or": [
        { "field": "is_urgent", "operator": "eq", "value": true },
        { "field": "category", "operator": "eq", "value": "safety" }
      ]
    }
  ]
}
```

**Supported operators**:

| Operator      | Description                  | Example                                                                         |
| ------------- | ---------------------------- | ------------------------------------------------------------------------------- |
| `eq`          | Equals                       | `{ "field": "status", "operator": "eq", "value": "urgent" }`                    |
| `neq`         | Not equals                   | —                                                                               |
| `gt`          | Greater than                 | `{ "field": "amount", "operator": "gt", "value": 1000 }`                        |
| `gte`         | Greater than or equal        | —                                                                               |
| `lt`          | Less than                    | —                                                                               |
| `lte`         | Less than or equal           | —                                                                               |
| `in`          | Value in array               | `{ "field": "category", "operator": "in", "value": ["equipment", "supplies"] }` |
| `not_in`      | Value not in array           | —                                                                               |
| `contains`    | String/array contains        | `{ "field": "tags", "operator": "contains", "value": "high-priority" }`         |
| `is_null`     | Field is null/missing        | `{ "field": "cost_center", "operator": "is_null" }`                             |
| `is_not_null` | Field exists and is not null | —                                                                               |

**Where conditions are used**:

| Location                 | How it works                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| Step `skip_condition`    | If condition evaluates to `true`, the step is **skipped** (auto-passes)                          |
| Step `require_condition` | Step only **runs** if condition is `true` (otherwise skipped)                                    |
| Auto-rule `condition`    | If condition is `true`, the auto-rule fires (auto-approve, auto-reject, or skip entire workflow) |

The condition engine is evaluated server-side (in an Edge Function or server action) at workflow start and at each step transition.

### Step Modes (Multi-Approver Support)

Each step has a `step_mode` that determines how multiple resolved approvers are handled:

| Mode         | Behavior                                                                                                             | Use case                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `sequential` | One approver resolved, one action needed                                                                             | Standard — direct superior, department head    |
| `any_one`    | Multiple approvers resolved (e.g., all workers with "Admin Approver" role). **First one to act** completes the step. | Pool of approvers — whoever is available first |
| `all_must`   | Multiple approvers resolved. **ALL must approve** for the step to pass. Any rejection rejects immediately.           | Unanimous — finance board, committee reviews   |

For `any_one` and `all_must`, the resolver must return multiple workers. This happens naturally with:

- `specific_role` — returns all workers with that role
- `custom` — can return any list of workers

### Escalation & SLA

Each step can have an **escalation rule** — what happens when the approver doesn't respond in time:

| Config field                  | Description                                                       |
| ----------------------------- | ----------------------------------------------------------------- |
| `escalation_hours`            | Hours to wait before escalation triggers. `NULL` = no escalation. |
| `escalation_action`           | What to do: see table below                                       |
| `escalation_notify_requester` | Also notify the requester that escalation occurred                |

**Escalation actions**:

| Action         | What happens                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| `notify_again` | Sends another notification (email + push + in-app) to the same approver. Resets the timer.                   |
| `escalate_up`  | Walks one level up the org tree and assigns to the next superior. Logs the escalation in `approval_actions`. |
| `auto_approve` | Automatically approves the step and advances the workflow. Logs as `auto_approved`.                          |
| `auto_reject`  | Automatically rejects. Logs as `auto_rejected`.                                                              |

Escalation is processed by a **Vercel Cron Job** that runs every hour, checking `approval_workflow_instances` for steps that have exceeded their `escalation_hours` with no action.

### Delegation

Approvers can **pre-delegate** their approval authority to another worker for a date range — useful when on leave or traveling:

- **Scope**: A delegation can cover all modules, one module, or one specific workflow template
- **Date range**: Active only between `start_date` and `end_date`
- **Resolution**: When the engine resolves an approver, it checks `approval_delegations` for active delegations. If found, the delegate receives the approval instead.
- **Audit**: The `approval_actions` row records both `acted_by` (the delegate) and `delegated_from` (the original approver)
- **UI**: Workers manage their delegations from their profile page (`/profile/delegations`)

**On-the-spot reassignment** is also supported: an approver can click "Reassign" on any pending approval to send it to a specific worker (if `allow_reassign` is enabled on the step). This is different from delegation — it's a one-time reassignment for a specific request, not a pre-set authority transfer.

### Recall & Cancel

The **requester** can recall a pending request at any time before it's fully approved:

- Recall sets the instance status to `recalled` and logs a `recalled` action
- All pending step assignments are cleared
- The originating module is notified via the `on_recalled` hook
- Already-completed steps in the trail are preserved for audit

An **admin** can cancel any workflow instance (sets status to `cancelled`).

### Hooks (Module Callbacks)

Hooks let modules **react to workflow events** without the engine knowing anything about the module's domain. Hooks are configured per workflow version (via admin UI) and fire automatically:

**Hook events**:

| Event               | When it fires                            |
| ------------------- | ---------------------------------------- |
| `on_submit`         | Workflow instance is created             |
| `on_step_approved`  | A step is approved (fires for each step) |
| `on_step_rejected`  | A step is rejected                       |
| `on_returned`       | A step is returned for revision          |
| `on_fully_approved` | All steps passed — final approval        |
| `on_fully_rejected` | Workflow rejected at any step            |
| `on_recalled`       | Requester recalled the request           |
| `on_escalated`      | Escalation triggered on a step           |

**Hook types**:

| Type            | What it does                                      | Config example                                                                                        |
| --------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `status_update` | Updates a field on the originating record         | `{ "table": "venue_requests", "field": "status", "value": "approved" }`                               |
| `notification`  | Sends a notification to specific workers or roles | `{ "to": "requester", "message": "Your {{module}} request was approved" }`                            |
| `edge_function` | Calls a Supabase Edge Function for custom logic   | `{ "function_name": "on-venue-approved", "payload": "instance" }`                                     |
| `field_update`  | Updates multiple fields on the record             | `{ "table": "venue_requests", "updates": { "approved_at": "NOW()", "approved_by": "{{acted_by}}" } }` |

Hooks support **template variables** (`{{requester_name}}`, `{{module}}`, `{{record_id}}`, `{{acted_by}}`, `{{step_name}}`, `{{comments}}`) that are interpolated at runtime.

### Versioning

Template changes don't break in-flight workflows:

1. **Edit a template** → The admin UI creates a **draft version** (marked `is_draft = TRUE`)
2. **Edit steps/conditions/hooks** on the draft → All changes apply to the draft version only
3. **Publish** → The draft is marked `is_draft = FALSE`, and `current_version` on the template increments
4. **Active instances** continue running on the version they started with — unaffected by the new version
5. **New requests** use the latest published version

The admin UI shows a **version history** with diffs so admins can see what changed between versions.

### Custom Fields per Step

Steps can define **custom fields** that the approver must fill when taking action. These are configured in the step's `custom_fields` JSONB:

```jsonc
// Example: Finance approval step requires cost center and budget code
{
  "fields": [
    {
      "name": "cost_center",
      "label": "Cost Center",
      "type": "select",
      "options": ["CC-100", "CC-200", "CC-300"],
      "required_on": ["approved"], // only required when approving
    },
    {
      "name": "budget_code",
      "label": "Budget Code",
      "type": "text",
      "required_on": ["approved"],
    },
    {
      "name": "rejection_category",
      "label": "Rejection Reason Category",
      "type": "select",
      "options": [
        "Budget exceeded",
        "Duplicate request",
        "Incomplete info",
        "Other",
      ],
      "required_on": ["rejected"], // only required when rejecting
    },
  ],
}
```

**Supported field types**: `text`, `textarea`, `number`, `select`, `multi_select`, `date`, `checkbox`

The approver's filled values are stored in `approval_actions.custom_field_values`.

### Module Integration

Any module can use the approval engine with minimal code:

```typescript
// In a module — triggering an approval workflow
import { startApproval } from "@/lib/approvals";

const instance = await startApproval({
  module: "venues",
  templateName: "Venue Reservation Approval",
  recordId: venueRequest.id,
  requestedBy: currentWorker.id,
  metadata: {
    venue_name: venueRequest.venue,
    venue_type: venueRequest.type, // used by conditions
    date: venueRequest.date,
    expected_attendees: venueRequest.attendees, // used by conditions
  },
});
// The engine evaluates auto-rules first, then starts at step 1
// Hooks fire on_submit automatically
```

```typescript
// Getting pending approvals for the current user (including delegated ones)
import { useMyPendingApprovals } from "@/lib/approvals";

const { data: pendingApprovals } = useMyPendingApprovals();
// Returns all approval instances where the current worker is the resolved
// approver (or delegate) for the current step — across ALL modules
```

```typescript
// Recalling a request
import { recallApproval } from "@/lib/approvals";

await recallApproval({
  instanceId: instance.id,
  requestedBy: currentWorker.id,
});
```

### Approval UI Components (Shared)

These components live in `src/lib/approvals/components/` and are used by all modules:

#### `<ApprovalPipeline>` — Step Visualization (GitLab CI/CD-style)

The primary visual for showing approval progress. Renders as a **horizontal pipeline of connected circles** — one circle per step — similar to GitLab's CI/CD pipeline visualization.

```
 Completed        Completed         Active (current)    Upcoming
 ┌────────┐      ┌────────┐        ┌────────┐         ┌────────┐
 │  ┌──┐  │      │  ┌──┐  │        │  ┌──┐  │         │  ┌──┐  │
 │  │✓ │──┼──────┼──│✓ │──┼────────┼──│⏳│──┼─ ─ ─ ─ ┼──│  │  │
 │  └──┘  │      │  └──┘  │        │  └──┘  │         │  └──┘  │
 │Ministry│      │  Dept  │        │ Finance│         │ Senior │
 │ Head   │      │  Head  │        │ Review │         │ Pastor │
 │        │      │        │        │        │         │        │
 │J. Smith│      │M. Cruz │        │Pending │         │        │
 │Mar 12  │      │Mar 13  │        │ 2d left│         │        │
 └────────┘      └────────┘        └────────┘         └────────┘
```

**Circle states and colors** (matching Minia's color palette):

| State                | Circle style                | Icon                      | Border / Fill                                   | Label           |
| -------------------- | --------------------------- | ------------------------- | ----------------------------------------------- | --------------- |
| **Approved**         | Solid filled                | `✓` checkmark             | `#2ab57d` (success green), white icon           | "Approved"      |
| **Rejected**         | Solid filled                | `✕` cross                 | `#fd625e` (danger red), white icon              | "Rejected"      |
| **Returned**         | Solid filled                | `↩` return arrow          | `#ffbf53` (warning amber), white icon           | "Returned"      |
| **Active (pending)** | Pulsing ring                | `⏳` hourglass or spinner | `#5156be` (primary), animated pulse border      | "Pending"       |
| **Escalated**        | Solid filled + warning ring | `⚠` warning               | `#ffbf53` (warning) outer ring, `#5156be` inner | "Escalated"     |
| **Skipped**          | Dashed outline              | `⏭` skip                 | `#74788d` (secondary gray), dashed border       | "Skipped"       |
| **Upcoming**         | Light outline               | Empty (no icon)           | `#e9e9ef` (gray-200), light border              | Step name only  |
| **Auto-approved**    | Solid filled                | `⚡` lightning            | `#2ab57d` (success green), white icon           | "Auto-approved" |

**Connector lines between circles**:

- **Completed → Completed**: Solid line, success green (`#2ab57d`)
- **Completed → Active**: Solid line, primary (`#5156be`)
- **Active → Upcoming**: Dashed line, gray (`#e9e9ef`)
- **Any → Rejected**: Solid line turns red at the rejected step
- **Skipped step**: Dashed connector bypasses the circle

**Circle size**: 40px diameter on desktop, 32px on mobile
**Connector line**: 2px width, horizontal, vertically centered on the circles

**Below each circle** (stacked vertically):

1. **Step name** — "Ministry Head", "Department Head", etc. (text-sm, muted)
2. **Approver name** — "J. Smith" (only shown for completed/active steps)
3. **Timestamp** or **status detail** — "Mar 12, 2:30 PM" for completed, "Pending · 2d left" for active, empty for upcoming

**Interactions**:

- **Hover/click a circle** → Shows a **popover** with full step details:
  - Step name and resolver info
  - Approver name and org position
  - Action taken (Approved/Rejected/Returned)
  - Comments left by the approver
  - Custom field values (if any)
  - Timestamp
  - Delegation info (if delegated: "Acted by X on behalf of Y")
  - Escalation history (if escalated)
- **Active step circle** has a subtle CSS animation (pulse/glow) to draw attention

**Responsive behavior**:

- **Desktop (>768px)**: Horizontal pipeline, all circles visible
- **Tablet (768px)**: Horizontal with scroll if >4 steps, or compact circles (smaller labels)
- **Mobile (<640px)**: Switches to **vertical pipeline** — circles stacked top-to-bottom with connectors running vertically, full step details visible inline (no hover needed)

**Variants**:

| Variant                          | Usage                | Notes                                               |
| -------------------------------- | -------------------- | --------------------------------------------------- |
| `<ApprovalPipeline size="lg">`   | Request detail pages | Full size with approver names and timestamps        |
| `<ApprovalPipeline size="sm">`   | List rows, cards     | Compact — circles only, no labels, tooltip on hover |
| `<ApprovalPipeline size="mini">` | Table cells          | Tiny inline dots, status colors only                |

**Mini variant** (for table rows and "My Approvals" list):

```
●───●───◉─ ─ ○    "3 of 4 steps · Pending Finance Review"
```

- Dots: 12px, color-coded by state
- One line, with a summary text next to it

#### `<ApprovalTimeline>` — Detailed Audit Log

A **vertical timeline** below the pipeline showing the full history of actions with rich detail. Used on request detail pages for the complete audit trail.

```
  │
  ├─ ● Mar 14, 2:30 PM ─────────────────────────
  │    Step 3: Finance Review
  │    ⏳ Pending — assigned to Maria Santos
  │    Escalation in 22 hours
  │
  ├─ ✓ Mar 13, 10:15 AM ────────────────────────
  │    Step 2: Department Head Approval
  │    Approved by Michael Cruz
  │    "Looks good, budget is within allocation."
  │    Cost Center: CC-200 · Budget Code: FIN-2024-Q1
  │
  ├─ ✓ Mar 12, 3:45 PM ─────────────────────────
  │    Step 1: Ministry Head Review
  │    Approved by James Smith
  │    (Delegated — acting on behalf of Ana Reyes, on leave)
  │    "Approved. Please coordinate with facilities."
  │
  ├─ ○ Mar 12, 2:00 PM ─────────────────────────
  │    Workflow started
  │    Submitted by Pedro Garcia (Worker #4521)
  │    Template: Purchase Request Approval v3
  │
```

Shows: step transitions, approver actions, comments, custom field values, delegations, escalations, reassignments, recalls — everything in chronological order.

#### Other Components

- **`<ApprovalActions>`** — Approve / Reject / Return / Reassign buttons with comment field and dynamic custom fields (rendered from step config). Only visible to the current approver (or delegate).
- **`<PendingApprovalsBadge>`** — Badge count for the header notification bell — shows total pending approvals across all modules
- **`<PendingApprovalsList>`** — List/table of all pending approvals for the current user, including delegated items (marked with a "delegated" badge). Each row shows the `<ApprovalPipeline size="mini">` inline.
- **`<RecallButton>`** — Allow requester to recall a pending request (shown only to the original requester)
- **`<DelegationManager>`** — UI for setting up, viewing, and cancelling approval delegations (used in profile page)

### "My Approvals" Page

A dedicated page (`/approvals`) shows all pending approvals for the current user, across all modules. This is a **core page**, not part of any module:

- **Tabs or filters**: All | Pending | Approved | Rejected | Delegated to Me | By Module
- **Each item shows**: Module name, request summary, requester name, date, `<ApprovalPipeline size="mini">` showing step progress, urgency indicator (if escalation is near), action buttons
- **Expand row**: Click a row to expand and show `<ApprovalPipeline size="lg">` with full step details inline
- **Delegated items**: Clearly marked with "Delegated from [Name]" badge
- **Click through**: Links to the specific record in the originating module (e.g., clicking a venue approval opens the venue request detail)
- **Bulk actions**: Approve or reject multiple items at once (with shared comment)

### Notifications

When a workflow step is activated (approval needed) or completed (approved/rejected):

- **In-app**: Supabase Realtime pushes a notification to the approver's browser
- **Push**: FCM push notification (mobile/desktop)
- **Email**: Resend sends an email with request summary and a deep link to approve/reject
- **Escalation reminders**: Additional notifications when escalation timer is approaching (at 75% of time elapsed)
- **Recall notifications**: Notify all involved parties when a request is recalled

### Admin: Workflow Builder

Admins manage workflow templates via a **visual workflow builder** at `/admin/settings/workflows`. This is the primary interface for full workflow customization — no code changes needed for any of these operations:

#### Template Management

- **Create template**: Choose module, name, description → starts with a blank draft version
- **Clone template**: Duplicate an existing template (including all steps, conditions, hooks) as a starting point
- **Activate / Deactivate**: Toggle a template on/off without deleting it
- **Delete**: Only if no active instances are using it

#### Visual Step Builder

- **Drag-and-drop step ordering**: Reorder steps by dragging
- **Add step**: Click "Add Step" → configure name, resolver, mode, conditions, escalation, custom fields
- **Step card UI**: Each step is a card showing resolver type, mode badge (`Sequential` / `Any One` / `All Must`), condition indicator, escalation timer
- **Inline editing**: Click any step card to edit its configuration in a slide-over panel
- **Remove step**: Delete a step (with warning if it would leave gaps)

#### Condition Builder (Visual)

- **No manual JSON editing**: Conditions are built via a visual UI:
  - Field dropdown (populated from the module's registered metadata fields)
  - Operator dropdown (eq, gte, lt, in, etc.)
  - Value input (text, number, select — based on field type)
  - AND/OR group toggles — click to add nested condition groups
- **Live preview**: Shows a human-readable summary: "Skip this step if `amount` is less than `5,000` AND `category` is `supplies`"

#### Resolver Configuration

- **Dropdown**: Choose resolver type (`direct_superior`, `node_type_head`, `levels_up`, `senior_pastor`, `specific_role`, `specific_worker`, `custom`)
- **Config form**: Dynamic form based on resolver type:
  - `node_type_head` → dropdown of all `org_node_types` slugs
  - `levels_up` → number input
  - `specific_role` → role picker
  - `specific_worker` → worker search/picker
  - `custom` → function name input
- **Test resolver**: "Preview" button that simulates resolution for a selected worker — shows who would be resolved as approver

#### Escalation Configuration

- **Toggle**: Enable/disable escalation per step
- **Timer**: Hours before escalation (number input)
- **Action**: Dropdown (Notify Again, Escalate Up, Auto-Approve, Auto-Reject)
- **Preview**: Shows what would happen if escalation fires

#### Auto-Rules

- **Rule list**: Ordered list of auto-approval/rejection rules for the template
- **Rule builder**: Same visual condition builder as step conditions
- **Actions**: Auto-approve, auto-reject, or skip entire workflow
- **Priority ordering**: Drag to reorder — first matching rule wins

#### Hooks Configuration

- **Event picker**: Choose which event to hook into
- **Hook type**: Choose status_update, notification, edge_function, or field_update
- **Config form**: Dynamic form based on hook type
- **Step scope**: Optionally scope a hook to a specific step (or fire for any step)
- **Template variables**: Autocomplete helper showing available `{{variables}}`

#### Versioning UI

- **Version timeline**: Visual list of all versions with publish dates, publishers, and change notes
- **Diff view**: Side-by-side comparison of any two versions (shows added/removed/changed steps, conditions, hooks)
- **Draft indicator**: Orange "Draft" badge when editing an unpublished version
- **Publish button**: Publishes the draft → creates a new immutable version
- **Rollback**: Revert to a previous version (creates a new version that copies the old one's config)

---

## Legacy System Reference

### Source Code Locations

- **ORS**: `/Users/jeromepacleb/Apps/ors` (CodeIgniter 3) — central hub
- **C2S**: `/Users/jeromepacleb/Apps/c2s` (CodeIgniter 3) — mentorship system
- **C2S Mobile**: `/Users/jeromepacleb/Apps/c2s-mobile` (Ionic 1 / AngularJS + Cordova) — Android mobile app for C2S
- **DRS**: `/Users/jeromepacleb/Apps/drs` (CodeIgniter 3) — digital room signage
- **CloudQR**: `/Users/jeromepacleb/Apps/cloudqr` (CodeIgniter 4) — meal stub QR scanner
- **Database Schema**: `/Users/jeromepacleb/Apps/cogdasma_db-schema.sql`

### Legacy System Map

Five apps, interconnected:

```
┌─────────────────────────────────────────────────────────────────┐
│                        LEGACY ARCHITECTURE                      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐       │
│  │                    cogdasma_db (MySQL)                │       │
│  │   113 tables — workers, venues, reservations,        │       │
│  │   mentorship, service requests, training, meals...   │       │
│  └──────────┬──────────────────┬────────────────────────┘       │
│             │ direct DB access │ direct DB access               │
│             ▼                  ▼                                │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │       ORS        │  │       C2S        │                    │
│  │  (CodeIgniter 3) │  │  (CodeIgniter 3) │                    │
│  │                  │  │                  │                    │
│  │  Venues          │  │  Mentorship      │                    │
│  │  Service Reqs    │  │  Connections     │                    │
│  │  Training        │  │  Registration    │                    │
│  │  Workers         │  │  Mobile API ─────┼──────────┐         │
│  │  Worker Pass     │  │                  │          │         │
│  │  Meals           │  │                  │          │         │
│  │  DrsRemote API ──┼──┼──────────┐      │          │         │
│  └──────────────────┘  └──────────┼──────┘          │         │
│                                   │                  │         │
│                          HTTP     │          REST API│         │
│                  (file_get_contents)   (X-API-KEY auth)        │
│                                   │                  │         │
│                                   ▼                  ▼         │
│  ┌──────────────────────────────────────┐                      │
│  │   DRS × 13 rooms (CodeIgniter 3)     │                      │
│  │                                      │                      │
│  │   Each room = XAMPP + local MySQL    │                      │
│  │   cogdasma_drs (local cache DB)      │                      │
│  │                                      │                      │
│  │   Polls ORS /DrsRemote every 60s    │                      │
│  │   Caches venues + bookings locally   │                      │
│  │   Falls back to cache if offline     │                      │
│  └──────────────────────────────────────┘                      │
│                                                                 │
│  ┌──────────────────────────────────────┐                      │
│  │   C2S Mobile (Ionic 1 + Cordova)     │                      │
│  │                                      │                      │
│  │   AngularJS app, Android only        │                      │
│  │   Calls C2S REST API (20+ endpoints) │                      │
│  │   Hardcoded API key in headers       │                      │
│  │   Dashboard, Groups, Mentees, Profile│                      │
│  │   C2S lesson status tracking (M1-M4) │                      │
│  └──────────────────────────────────────┘                      │
│                                                                 │
│  ┌──────────────────────────────────────┐                      │
│  │   CloudQR (CodeIgniter 4)            │                      │
│  │                                      │                      │
│  │   Standalone prototype              │                      │
│  │   Hardcoded auth (no DB)            │                      │
│  │   Instascan.js camera scanner       │                      │
│  │   Reads QR but no backend logging   │                      │
│  │   Was meant to connect to ORS       │                      │
│  │   but never fully integrated        │                      │
│  └──────────────────────────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

**Consolidation into COG App v2**:

```
┌─────────────────────────────────────────────────────────────────┐
│                      NEW ARCHITECTURE                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              Supabase (PostgreSQL)                   │       │
│  │   Auth, RLS, Realtime, Storage, Edge Functions       │       │
│  └──────────────────────┬───────────────────────────────┘       │
│                         │                                       │
│                         ▼                                       │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              COG App v2 (Next.js 15)                 │       │
│  │                                                      │       │
│  │   ORS ──→  Venues, Service Requests, Training,       │       │
│  │            Workers, Worker Pass modules               │       │
│  │                                                      │       │
│  │   C2S ──→  Mentorship, Connections modules            │       │
│  │                                                      │       │
│  │   DRS ──→  Signage module                             │       │
│  │            Public route: /signage/[room-id]           │       │
│  │            Supabase Realtime (no polling)              │       │
│  │            Browser kiosk (no XAMPP)                    │       │
│  │                                                      │       │
│  │   CloudQR → Meals module                              │       │
│  │             Scanner: /meals/scan                      │       │
│  │             html5-qrcode (no Instascan)               │       │
│  │             Scan logging + redemption tracking         │       │
│  │                                                      │       │
│  │   C2S Mobile → Replaced by Capacitor shell            │       │
│  │                Same Next.js app, native wrapper        │       │
│  │                iOS + Android (was Android-only)        │       │
│  │                                                      │       │
│  │   NEW ──→  Roles, System, Approval Engine             │       │
│  └──────────────────────────────────────────────────────┘       │
│                         │                                       │
│                    Capacitor                                    │
│                         │                                       │
│                    ┌────┴────┐                                  │
│                    ▼         ▼                                  │
│               iOS App   Android App                             │
│             (same codebase, local builds)                       │
└─────────────────────────────────────────────────────────────────┘
```

**What each legacy system contributes**:

| Legacy System  | Framework         | DB                                    | Connection Method                                         | Modules in COG App v2                                                     |
| -------------- | ----------------- | ------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------- |
| **ORS**        | CodeIgniter 3     | `cogdasma_db` (MySQL, direct)         | Central hub — everything connects to it                   | Venues, Service Requests, Training, Workers, Worker Pass, Meals (partial) |
| **C2S**        | CodeIgniter 3     | `cogdasma_db` (MySQL, direct)         | Shares same DB tables as ORS                              | Mentorship, Connections                                                   |
| **DRS**        | CodeIgniter 3     | `cogdasma_drs` (local MySQL per room) | HTTP API → `ORS/DrsRemote` endpoints                      | Signage                                                                   |
| **CloudQR**    | CodeIgniter 4     | None (hardcoded auth)                 | Standalone prototype, never fully integrated              | Meals (scanner)                                                           |
| **C2S Mobile** | Ionic 1 / Cordova | None (calls C2S REST API)             | HTTP REST → `cogdasma.com/c2s/api` with hardcoded API key | Replaced by Capacitor shell (same Next.js codebase, iOS + Android)        |

**Key architectural changes**:

| Legacy                                                            | New                                              |
| ----------------------------------------------------------------- | ------------------------------------------------ |
| 5 separate apps, 4 frameworks (CI3, CI3, CI3, CI4, Ionic/Cordova) | 1 app (Next.js 15)                               |
| MySQL (`cogdasma_db`) + 13 local SQLite/MySQL caches              | Supabase PostgreSQL (single source of truth)     |
| Cross-app HTTP calls (`file_get_contents`)                        | Direct Supabase queries + Realtime subscriptions |
| XAMPP on 13 room computers                                        | Browser kiosk → Vercel URL                       |
| No mobile app (C2S had a basic REST API)                          | Capacitor native shells (iOS + Android)          |
| Hardcoded roles, per-app auth                                     | Unified Supabase Auth + RBAC + RLS               |
| No real-time updates (polling)                                    | Supabase Realtime (WebSocket) everywhere         |
| C2S Mobile: Ionic 1 + Cordova, Android only, hardcoded API key    | Same Next.js web app wrapped in Capacitor        |

### Shared Database: `cogdasma_db` (MySQL, 113 tables)

The database contains core tables, view tables (materialized/virtual), and session tables. Key entity groups:

#### Organizational Structure

- `department` — 5 departments (Worship, Outreach, Relationship, Discipleship, Admin)
- `ministry` — Ministries under departments
- `worker` — Staff/mentors with types (Full-time, Part-time, etc.)
- `worker_view`, `worker_count_by_department_view`, `worker_count_by_ministry_view`

#### C2S Domain (Mentorship)

- `c2s_group` — Mentoring groups (physical & online types)
- `c2s_online_category` — Online mentoring categories
- `c2s_online_schedule` — Time slot definitions
- `c2s_online_zoom_link` — Zoom meeting links
- `c2s_online_group_details` — Online group metadata
- `mentee` — Coached individuals linked to groups/mentors
- `online_mentee_registration` — Public mentee signup data
- `facilitator` — Facilitator records
- `deactivated_logs` — Mentorship deactivation audit trail
- Views: `c2s_group_summary_view`, `c2s_online_group_view`, `c2s_online_mentee_view`, `mentees_by_department`, `mentors_by_department`, `mentees_summary_view`, `mentors_summary_view`, `mentor_mentee_view`, `mentor_mentee_all_in_view`, etc.

#### ORS Domain (Resource Management)

- **Service Requests**: `service_request`, `sr_type`, `sr_category`, `sr_subcategory`, `sr_details_arf`, `sr_resources`, `sr_resources_subcategory`, `sr_status`, `sr_work_order`, `sr_view`, `sr_work_order_view`
- **Venue & Equipment**: `request_ve`, `request_ve_equipment`, `venue`, `area`, `equipment`, `rve_view`, `rve_approver_view`, `rve_equipment_view`
- **Training**: `training`, `worker_training_mapping`, `worker_training_view`
- **Meal Stubs**: `ms_assignment`, `ms_canteen`, `ms_canteens`, `ms_dept_setting`, `ms_min_setting`, `ms_scan`, `ms_scan_view`, `ms_assignment_view`
- **Worker Pass**: `worker_pass`, `worker_pass_batch`, `worker_pass_view`, `workerpass_user`

#### Shared System Tables

- `approver`, `approver_view` — Multi-level approval chain
- `login_history`, `login_history_c2s`, `login_history_view` — Audit trail
- `email_job` — Queued email jobs
- `message_template` — Email/notification templates
- `audit_logs` — System audit logs
- `action_history`, `ah_type` — Action tracking
- `satellite` — Satellite/branch locations
- `health_checklist` — Health check records
- `hr_attendance_scan`, `hr_scanner_site` — HR attendance

---

## Legacy Features to Consolidate

### From C2S (Mentorship System)

| Module                      | Description                                                   | Legacy API        |
| --------------------------- | ------------------------------------------------------------- | ----------------- |
| **Dashboard**               | Analytics — connections by dept, mentee/mentor counts, charts | REST + Web        |
| **Physical Groups**         | CRUD for in-person mentoring groups with mentee assignment    | Full REST API     |
| **Online Groups**           | CRUD with schedule, Zoom links, category management           | Full REST API     |
| **Connections**             | Track personal "souls" (discipleship contacts)                | Web only          |
| **Public Registration**     | External mentee signup for online programs                    | Web form          |
| **Mentor Profiles**         | Profile management, password, contact info                    | Web + API         |
| **Reporting**               | Department-level metrics, connection counts, trend analysis   | Web only          |
| **Deactivation Automation** | Auto-deactivate mentors/mentees after 90 days inactivity      | Scheduled trigger |

### From ORS (Resource Management)

| Module                 | Description                                                         | Legacy API    |
| ---------------------- | ------------------------------------------------------------------- | ------------- |
| **Service Requests**   | Ticketing with type → category → subcategory hierarchy, work orders | Web only      |
| **Venue Reservations** | Calendar-based venue booking with conflict detection                | Web + API     |
| **Equipment Booking**  | Equipment reservation tied to venue requests                        | Web only      |
| **Training Tracking**  | Course management, worker completion mapping, dept summaries        | Web only      |
| **Meal Management**    | Worker meal scheduling, QR generation, canteen assignment           | Web only      |
| **Worker Management**  | Profiles, QR codes, bulk operations                                 | Web only      |
| **Approval Workflows** | Multi-level: Worker → Ministry Head → Admin Head                    | Web only      |
| **Email Jobs**         | Queued email processing with rate limiting                          | Batch trigger |
| **Audit & Compliance** | Login history, action tracking, audit logs                          | Web only      |

---

## Authentication & Authorization

### Legacy Authentication (for reference)

- Session-based (CodeIgniter sessions)
- Workers log in using their **Worker ID** (numeric ID from the `worker` table) + password
- Passwords stored as MD5 hash (C2S) ⚠️
- Worker status check (Active/Inactive/Pending)
- Password expiration enforcement (ORS)

### New Authentication (Supabase Auth)

Migrate to Supabase Auth while preserving the Worker ID login experience:

1. **Worker ID as login identifier**: Workers are accustomed to logging in with their numeric Worker ID. Preserve this UX — use Worker ID as the username/identifier when authenticating against Supabase Auth.
2. **Password migration**: During the data migration, import existing MD5 password hashes into Supabase Auth. On first login, Supabase will verify against the imported hash and transparently re-hash to bcrypt. Workers do NOT need to reset their passwords.
3. **Supabase Auth user ↔ Worker profile**: Each Supabase Auth user is linked to a `workers` row via the `worker_id` stored in `auth.users.user_metadata` or a `workers.auth_user_id` foreign key.
4. **Session management**: JWT-based sessions via Supabase Auth (replaces CodeIgniter sessions)
5. **RLS enforcement**: Row Level Security policies on all tables using the authenticated user's worker profile

### Access Levels

Access levels are determined by the worker's position in the **generic org tree** (see [Organizational Structure](#organizational-structure)). There are no hardcoded level-specific flags — leadership is derived from `org_nodes.head_worker_id`:

```
Senior Pastor     → Full system access (is_senior_pastor flag on worker)
Head of any node  → Scoped to that node + all descendants (derived from org_nodes.head_worker_id)
Worker            → Own data only (default)
```

Because the org tree is generic, access levels automatically adapt when you add, rename, or reorder levels. A "Department Head" and a "Region Head" use the same logic — the scope is the node's subtree.

### Approval Chain

Approval routing is handled by the **Approval Workflow Engine** (see [Approval Workflow Engine](#approval-workflow-engine)). The engine walks up the org tree via `parent_id` to find approvers — it works with **any number of levels** and adapts automatically when the tree structure changes:

```
Worker → Head of assigned node → Head of parent node → ... → Senior Pastor
```

---

## Roles & Privileges (RBAC)

This is a **core architectural feature** — not an afterthought. Every menu item, page, action, and API call in COG App is governed by a dynamic permission system. This system must be in place from day one so that every feature added in the future is automatically permission-gated.

### Design Principles

1. **Default deny**: If no permission is explicitly granted, access is denied
2. **Permission-driven UI**: The sidebar menu, page content, and action buttons only render if the user has the required permission — no hardcoded role checks in components
3. **Convention-enforced**: Every new route/page MUST declare its required permission. This is enforced by middleware, not developer discipline
4. **Dynamic**: Roles and permissions are managed via an admin UI — not hardcoded in code. New permissions are registered when new modules are added
5. **Super admin bypass**: The "Admin" role has an `is_super_admin` flag that bypasses all permission checks

### Database Schema

```sql
-- Roles (e.g., Admin, Ministry Head, Worker, Custom Role...)
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,          -- 'Admin', 'Ministry Head', 'Department Head', 'Worker'
  description TEXT,
  is_super_admin BOOLEAN DEFAULT FALSE, -- bypasses all permission checks
  is_system_role BOOLEAN DEFAULT FALSE, -- cannot be deleted via UI
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions (granular, module:action format)
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT NOT NULL,               -- 'mentorship', 'venues', 'service_requests', 'admin'
  action TEXT NOT NULL,               -- 'view', 'create', 'update', 'delete', 'approve', 'export'
  description TEXT,                   -- human-readable: 'View mentorship groups'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module, action)
);

-- Role ↔ Permission mapping (many-to-many)
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Worker ↔ Role mapping (a worker can have multiple roles)
CREATE TABLE worker_roles (
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES workers(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (worker_id, role_id)
);
```

### Permission Naming Convention

Permissions follow a strict `module:action` format. This is the **single source of truth** for what can be controlled:

```typescript
// src/lib/permissions/registry.ts — the permission registry
// When you add a new module, register its permissions here.
// The admin UI, sidebar menu, middleware, and RLS all reference this.

export const PERMISSIONS = {
  // ── Dashboard ──
  dashboard: {
    view: "dashboard:view",
  },

  // ── Mentorship (from C2S) ──
  mentorship: {
    view: "mentorship:view",
    create: "mentorship:create",
    update: "mentorship:update",
    delete: "mentorship:delete",
    view_reports: "mentorship:view_reports",
  },

  // ── Connections (from C2S) ──
  connections: {
    view: "connections:view",
    create: "connections:create",
    update: "connections:update",
    delete: "connections:delete",
  },

  // ── Venue Reservations (from ORS) ──
  venues: {
    view: "venues:view",
    create: "venues:create",
    update: "venues:update",
    delete: "venues:delete",
    approve: "venues:approve",
    view_calendar: "venues:view_calendar",
  },

  // ── Service Requests (from ORS) ──
  service_requests: {
    view: "service_requests:view",
    create: "service_requests:create",
    update: "service_requests:update",
    delete: "service_requests:delete",
    approve: "service_requests:approve",
    assign_work_order: "service_requests:assign_work_order",
  },

  // ── Training (from ORS) ──
  training: {
    view: "training:view",
    create: "training:create",
    update: "training:update",
    delete: "training:delete",
    manage_completions: "training:manage_completions",
  },

  // ── Meals (from ORS) ──
  meals: {
    view: "meals:view",
    create: "meals:create",
    update: "meals:update",
    delete: "meals:delete",
    scan: "meals:scan",
  },

  // ── Workers ──
  workers: {
    view: "workers:view",
    create: "workers:create",
    update: "workers:update",
    delete: "workers:delete",
    manage_passes: "workers:manage_passes",
  },

  // ── Roles & Privileges (admin) ──
  roles: {
    view: "roles:view",
    create: "roles:create",
    update: "roles:update",
    delete: "roles:delete",
    assign: "roles:assign", // assign roles to workers
  },

  // ── System ──
  system: {
    view_audit_logs: "system:view_audit_logs",
    manage_settings: "system:manage_settings",
    manage_email_templates: "system:manage_email_templates",
  },
} as const;
```

### Adding a New Module (Future Features)

When a new feature is added to COG App, the developer (or AI) MUST:

1. **Register permissions** in `src/lib/permissions/registry.ts`:

   ```typescript
   // Example: adding a new "announcements" module
   announcements: {
     view: 'announcements:view',
     create: 'announcements:create',
     update: 'announcements:update',
     delete: 'announcements:delete',
     publish: 'announcements:publish',
   },
   ```

2. **Register menu items** in `src/lib/navigation/menu.ts` with required permission:

   ```typescript
   {
     label: 'Announcements',
     icon: 'megaphone',
     href: '/announcements',
     permission: 'announcements:view', // ← sidebar only shows if user has this
   }
   ```

3. **Add route middleware** — the page layout auto-checks the permission declared in the route config. No manual checks needed in page components.

4. **Seed permissions** — add a migration or seed script that inserts the new permissions into the `permissions` table.

5. **Assign to roles** — via the admin UI, assign the new permissions to the appropriate roles.

That's it. The menu, middleware, and RLS all pick up the new permissions automatically.

### Sidebar Menu (Permission-Driven)

The sidebar menu is **generated from a config**, not hardcoded in JSX. Each menu item declares its required permission:

```typescript
// src/lib/navigation/menu.ts
export const MENU_CONFIG: MenuItem[] = [
  {
    label: "Dashboard",
    icon: "layout-dashboard",
    href: "/dashboard",
    permission: "dashboard:view",
  },
  {
    section: "Mentorship",
    permission: "mentorship:view", // section hidden if no access
    items: [
      {
        label: "Groups",
        icon: "users",
        href: "/mentorship/groups",
        permission: "mentorship:view",
      },
      {
        label: "Connections",
        icon: "heart",
        href: "/mentorship/connections",
        permission: "connections:view",
      },
      {
        label: "Registration",
        icon: "user-plus",
        href: "/mentorship/registration",
        permission: "mentorship:create",
      },
      {
        label: "Reports",
        icon: "bar-chart-2",
        href: "/mentorship/reports",
        permission: "mentorship:view_reports",
      },
    ],
  },
  {
    section: "Resources",
    permission: "venues:view",
    items: [
      {
        label: "Venue Reservations",
        icon: "calendar",
        href: "/venues",
        permission: "venues:view",
      },
      {
        label: "Service Requests",
        icon: "clipboard",
        href: "/service-requests",
        permission: "service_requests:view",
      },
    ],
  },
  {
    section: "Operations",
    items: [
      {
        label: "Training",
        icon: "graduation-cap",
        href: "/training",
        permission: "training:view",
      },
      {
        label: "Meals",
        icon: "utensils",
        href: "/meals",
        permission: "meals:view",
      },
      {
        label: "Worker Pass",
        icon: "id-card",
        href: "/worker-pass",
        permission: "workers:manage_passes",
      },
    ],
  },
  {
    section: "Admin",
    permission: "roles:view",
    items: [
      {
        label: "Workers",
        icon: "users",
        href: "/admin/workers",
        permission: "workers:view",
      },
      {
        label: "Roles & Privileges",
        icon: "shield",
        href: "/admin/roles",
        permission: "roles:view",
      },
      {
        label: "Audit Logs",
        icon: "file-text",
        href: "/admin/audit",
        permission: "system:view_audit_logs",
      },
      {
        label: "Settings",
        icon: "settings",
        href: "/admin/settings",
        permission: "system:manage_settings",
      },
    ],
  },
];
```

The sidebar component iterates this config and **only renders items the current user has permission for**. If an entire section has no visible items, the section header is hidden too.

### Middleware / Route Protection

Every authenticated route is protected by middleware that:

1. Checks if the user is authenticated (via Supabase Auth)
2. Loads the user's roles and permissions (cached in session/context)
3. Checks the route's required permission against the user's permission set
4. If denied: redirects to a "403 Forbidden" page or the dashboard
5. Super admin (`is_super_admin = true`) bypasses all checks

```typescript
// Route config declares required permission
// src/app/(authenticated)/mentorship/groups/page.tsx
export const metadata = { permission: "mentorship:view" };
```

### Component-Level Permission Checks

For action buttons and inline UI elements, use a `<Can>` component or `usePermission` hook:

```tsx
// Hide a button if user can't delete
<Can permission="mentorship:delete">
  <Button variant="destructive" onClick={handleDelete}>
    Delete Group
  </Button>
</Can>;

// Or via hook
const canApprove = usePermission("venues:approve");
```

### Data-Level Access (RLS)

Supabase Row Level Security (RLS) policies reference the worker's roles to restrict data access at the database level — even if the UI is bypassed:

- **User-level**: Workers see only their own data (own groups, own connections)
- **Ministry-level**: Ministry heads see all data in their ministry
- **Department-level**: Department heads see all data in their department
- **Admin-level**: Super admins see everything

RLS policies query the `worker_roles` and `role_permissions` tables via a Supabase function (e.g., `auth.has_permission('mentorship:view')`) to enforce access.

### Admin UI for Roles & Privileges

A dedicated admin page (`/admin/roles`) allows managing the RBAC system:

- **View all roles**: List roles with permission counts
- **Create/edit roles**: Name, description, select permissions from grouped checkboxes
- **Assign roles to workers**: Search worker, assign/remove roles
- **View permission matrix**: Grid showing all roles × all permissions (checkbox matrix)
- **System roles**: Admin and Worker roles are protected — cannot be deleted, but permissions can be adjusted

### Default Roles (Seeded)

| Role                | Permissions                                               | System Role |
| ------------------- | --------------------------------------------------------- | ----------- |
| **Admin**           | `is_super_admin = true` — all permissions                 | Yes         |
| **Ministry Head**   | View + manage ministry-scoped data, approve requests      | Yes         |
| **Admin Head**      | Ministry Head + admin-level approvals                     | Yes         |
| **Department Head** | View department-scoped data                               | Yes         |
| **Worker**          | View own data, create connections/groups, submit requests | Yes         |

Custom roles can be created via the admin UI for specific needs (e.g., "Canteen Manager" with only `meals:*` permissions).

### Impersonation

Super admins can impersonate any worker to see exactly what they see — same permissions, same data, same menu. This is essential for debugging access issues, onboarding support, and verifying role configurations.

#### How It Works

1. **Who can impersonate**: Only users with `is_super_admin = true`. This is NOT a regular permission — it cannot be granted to custom roles.
2. **Start impersonation**: Admin selects a worker from the Workers list or admin bar → "View as [Worker Name]"
3. **During impersonation**:
   - The app behaves **exactly** as if the admin is the impersonated worker — same sidebar menu, same permissions, same data scope (RLS)
   - A prominent **impersonation banner** is shown at the top of the page (e.g., yellow/warning bar: "You are viewing as **John Doe** (Worker #42) — [End Session]")
   - The banner is always visible and cannot be dismissed — it sticks above the header
   - All actions taken during impersonation are **read-only by default** — no writes unless the admin explicitly enables "act as" mode
4. **End impersonation**: Click "End Session" in the banner → returns to admin's own session immediately

#### Implementation

```typescript
// Impersonation context stored in session/cookie
interface ImpersonationState {
  isImpersonating: boolean;
  originalWorkerId: string; // the admin's real worker ID
  impersonatedWorkerId: string; // who they're viewing as
  readOnly: boolean; // default true — prevents writes
}
```

- **Auth context**: When impersonating, the `useAuth()` / `useCurrentWorker()` hooks return the impersonated worker's profile, roles, and permissions — not the admin's
- **RLS bypass**: Impersonation uses a Supabase service role client scoped to the impersonated worker's ID, so RLS policies apply as if the real worker is logged in
- **Audit trail**: All impersonation sessions are logged in `audit_logs` with: who impersonated, who was impersonated, start/end timestamps, and whether any write actions were taken

#### Permissions During Impersonation

| Action                                  | Allowed?                                         |
| --------------------------------------- | ------------------------------------------------ |
| View pages/data as the worker           | Yes                                              |
| See the worker's sidebar menu           | Yes                                              |
| Create/update/delete data               | No (read-only by default)                        |
| Create/update/delete data (act-as mode) | Yes — logged as "admin acting as worker"         |
| Access admin pages                      | No — impersonation uses the worker's permissions |
| Start another impersonation             | No — must end current session first              |

#### UI Components

- **Impersonation banner**: Fixed bar above the header (z-index above everything), warning/yellow color, shows impersonated worker name + ID + "End Session" button + optional "Enable Write Mode" toggle
- **Worker list action**: "Impersonate" button/icon on each worker row in the admin Workers page (only visible to super admins)
- **Quick impersonate**: Search bar in admin toolbar to quickly find and impersonate a worker

---

## Legacy API Endpoints (Reference Only)

These legacy API contracts are listed for **reference only** — they will NOT be maintained. The mobile app will be fully rewritten to use Supabase directly. Use these to understand the data contracts and business logic that need to be replicated.

### C2S REST API

```
POST   /api/login                        → Worker auth
GET    /api/dashboard                    → Analytics data
GET    /api/physical_groups/:worker_id   → List physical groups
GET    /api/physical_group/:id           → Group details
POST   /api/physical_group_add           → Create group
POST   /api/physical_group_update        → Update group
POST   /api/physical_group_delete        → Delete group
GET    /api/online_groups/:worker_id     → List online groups
GET    /api/online_group/:id             → Group + schedule + Zoom
POST   /api/online_group_add             → Create online group
POST   /api/online_group_update          → Update online group
POST   /api/online_group_delete          → Delete online group
GET    /api/group_assets                 → Categories + schedules
```

### ORS REST API

```
GET    /api/approved_one_year            → VEs approved in past year
GET    /api/approved_future              → Future approved VEs
GET    /api/mentor_mentee_all_in         → Mentor-mentee relationships
GET    /api/ministries                   → Ministry listing
GET    /api/departments                  → Department listing
```

---

## Database Domain Map

```
cogdasma_db
├── Organization
│   ├── department
│   ├── ministry
│   ├── worker (central entity — used by both C2S and ORS)
│   └── satellite
│
├── Mentorship (C2S)
│   ├── c2s_group (physical + online)
│   ├── c2s_online_category
│   ├── c2s_online_schedule
│   ├── c2s_online_zoom_link
│   ├── c2s_online_group_details
│   ├── mentee
│   ├── facilitator
│   ├── online_mentee_registration
│   └── deactivated_logs
│
├── Service Requests (ORS)
│   ├── service_request
│   ├── sr_type / sr_category / sr_subcategory
│   ├── sr_details_arf
│   ├── sr_resources / sr_resources_subcategory
│   ├── sr_status
│   └── sr_work_order
│
├── Venue & Equipment (ORS)
│   ├── request_ve
│   ├── request_ve_equipment
│   ├── venue / area
│   └── equipment
│
├── Training (ORS)
│   ├── training
│   └── worker_training_mapping
│
├── Meal Stubs (ORS)
│   ├── ms_assignment
│   ├── ms_canteen / ms_canteens
│   ├── ms_dept_setting / ms_min_setting
│   └── ms_scan
│
├── Worker Pass (ORS)
│   ├── worker_pass
│   └── worker_pass_batch
│
├── Auth & System
│   ├── approver
│   ├── login_history / login_history_c2s
│   ├── email_job
│   ├── message_template
│   ├── audit_logs
│   ├── action_history / ah_type
│   └── health_checklist
│
└── HR
    ├── hr_attendance_scan
    └── hr_scanner_site
```

---

## Development Guidelines

### Reference Pattern

When implementing any feature, always reference the legacy source code for business logic:

- **C2S controllers**: `/Users/jeromepacleb/Apps/c2s/application/controllers/`
- **C2S models**: `/Users/jeromepacleb/Apps/c2s/application/models/`
- **ORS controllers**: `/Users/jeromepacleb/Apps/ors/application/controllers/`
- **ORS models**: `/Users/jeromepacleb/Apps/ors/application/models/`
- **Database schema**: `/Users/jeromepacleb/Apps/cogdasma_db-schema.sql`

### Business Logic Preservation

- Replicate the exact business rules from legacy controllers/models
- Maintain the same approval workflow hierarchies
- Preserve data validation rules from legacy form validation
- Keep the 90-day inactivity deactivation logic (C2S)
- Maintain conflict detection for venue reservations (ORS)
- Preserve the SR type → category → subcategory → details hierarchy

### Security Improvements Over Legacy

- MD5 passwords migrated to Supabase Auth (auto-rehashed to bcrypt on first login)
- Use environment variables for all secrets (no hardcoded credentials)
- Row Level Security (RLS) on all Supabase tables
- Supabase Auth JWT sessions (replaces CodeIgniter sessions)
- Parameterized queries via Supabase client (no raw SQL injection risk)
- Rate limiting on authentication endpoints

---

## Testing Strategy

### Overview

| Layer    | Tool                           | What to test                          |
| -------- | ------------------------------ | ------------------------------------- |
| **Unit** | Vitest + React Testing Library | Business logic, utilities, components |
| **E2E**  | Playwright                     | Critical user flows, cross-browser    |
| **DB**   | pgTAP (via Supabase)           | RLS policies, database functions      |

### Unit Tests (Vitest)

Vitest for all unit and component tests — fast, native ESM, first-class TypeScript support.

**Test what matters**:

- Business logic functions (approval condition engine, org tree traversal, permission resolvers, status transitions)
- Utility/helper functions (time formatting, QR data validation, pagination math, search scoring)
- React hooks (custom hooks like `usePermission`, `useOrgScope`, `useRealtimeSubscription`)
- React components (with React Testing Library — test behavior, not implementation)

**Skip**:

- Snapshot tests (brittle with Tailwind class changes)
- Testing Supabase client internals (trust the SDK)
- Testing third-party library behavior (shadcn/ui, TanStack, etc.)
- 100% coverage targets — focus on critical paths

**File conventions**:

```
src/modules/meals/
├── lib/
│   ├── resolve-stub-status.ts
│   └── resolve-stub-status.test.ts    ← co-located test
├── components/
│   ├── scanner.tsx
│   └── scanner.test.tsx               ← co-located test
```

**Mock boundaries**:

- Mock Supabase client at the module boundary (never test against real Supabase in unit tests)
- Mock `next/navigation` for component tests that use router
- Use factory functions for test data (e.g., `createMockWorker()`, `createMockMealEvent()`)

### E2E Tests (Playwright)

Playwright for end-to-end tests — multi-browser, built-in API testing, reliable.

**Critical flows to cover**:

| Flow                          | Priority | Description                                                     |
| ----------------------------- | -------- | --------------------------------------------------------------- |
| **Login**                     | P0       | Worker ID + password → dashboard                                |
| **RBAC enforcement**          | P0       | Unauthorized user cannot access restricted pages                |
| **Service Request lifecycle** | P1       | Create → submit → approve → complete                            |
| **Approval workflow**         | P1       | Submit request → each approver acts → final status              |
| **Venue reservation**         | P1       | Create reservation → conflict detection → approval              |
| **Meal QR scan**              | P1       | Select event → scan QR → success / double-redemption rejection  |
| **Signage display**           | P1       | Load public page → shows correct room status → real-time update |
| **Mentorship**                | P2       | Create group → add mentee → track progress                      |
| **Worker management**         | P2       | Search → view profile → edit → bulk operations                  |
| **Impersonation**             | P2       | Admin impersonates worker → sees correct scope → exits          |

**Test file location**:

```
e2e/
├── auth.spec.ts
├── service-requests.spec.ts
├── approvals.spec.ts
├── meals.spec.ts
├── signage.spec.ts
├── venues.spec.ts
└── fixtures/
    ├── auth.ts          ← login helpers, test users
    └── seed.ts          ← seed data for E2E scenarios
```

**E2E guidelines**:

- Run against a dedicated Supabase test project (seeded before each test suite)
- Use Playwright's `storageState` to avoid re-logging in for every test
- Test across Chromium and WebKit (covers Chrome + Safari — the two browsers workers will use)
- No Firefox unless specifically needed
- Keep tests independent — each test seeds its own data, no shared mutable state between tests
- Use `data-testid` attributes for stable selectors (never select by CSS class or Tailwind utility)

### Database Tests (pgTAP)

Test RLS policies and database functions directly in PostgreSQL using pgTAP (Supabase supports this natively).

**What to test**:

- RLS policies — verify a worker can only see data within their org scope
- `get_org_subtree()` function returns correct nodes
- `resolve_superiors()` function finds the right approval chain
- Approval workflow state transitions (cannot approve an already-completed step)
- Meal stub uniqueness constraint (one stub per worker per event)

### What NOT to Test

- Supabase Auth internals (sign-up, JWT refresh, etc.) — trust the platform
- shadcn/ui component rendering — trust the library
- CSS / visual regression — not worth the maintenance cost for an internal admin app
- Performance benchmarks — premature for initial build
- Mobile-specific tests — defer until Capacitor shell is built

### CI Integration

Tests run on every push via GitHub Actions (or equivalent):

```
push → lint + type-check → unit tests (Vitest) → build → E2E tests (Playwright)
```

- Unit tests: fast, run on every push and PR
- E2E tests: run on PR to main, and before deployment
- Fail the build if any test fails — no deploying broken code

---

## Migration Strategy: MySQL → Supabase (PostgreSQL)

### Approach: Clean Schema + Phased Data Migration

Do NOT 1:1 copy the legacy MySQL schema. Design a clean, normalized PostgreSQL schema in Supabase that leverages RLS, proper foreign keys, and modern patterns. Migrate data module-by-module.

### Why This Approach

- Legacy schema has 113 tables — many are redundant views, session tables, and temp tables
- Supabase features (Auth, RLS, Realtime, Storage) only work with PostgreSQL
- Clean break — MySQL will NOT be retained after migration
- Opportunity to normalize and improve the schema design

### Migration Phases

| Phase                   | Scope                        | What Happens                                                                                                                                                                                                                      |
| ----------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Foundation**       | Org structure + Auth         | Design clean PostgreSQL schema for `departments`, `ministries`, `workers`. Migrate worker data. Create Supabase Auth users with imported MD5 password hashes (Worker ID as identifier). Workers can log into COG App immediately. |
| **2. Mentorship**       | C2S modules                  | Migrate groups, mentees, registrations, schedules. Build COG App mentorship UI. Retire C2S web + mobile app.                                                                                                                      |
| **3. Reservations**     | Venue + Equipment            | Migrate venues, areas, equipment, requests. Build reservation calendar with conflict detection. Retire ORS venue module.                                                                                                          |
| **4. Service Requests** | SR system                    | Migrate SR type hierarchy, work orders, approval workflows. Retire ORS SR module.                                                                                                                                                 |
| **5. Operations**       | Training, Meals, Worker Pass | Migrate remaining operational modules. Retire remaining ORS features.                                                                                                                                                             |
| **6. Decommission**     | Full cutover                 | All features live in COG App. Legacy C2S + ORS shut down. MySQL database archived.                                                                                                                                                |

### Per-Module Migration Steps

For each module:

1. Design PostgreSQL tables in Supabase (with RLS policies)
2. Build the COG App UI + API against the new schema
3. Write a one-time data migration script (MySQL → PostgreSQL)
4. Run migration, validate data integrity
5. Point users to the new module in COG App
6. Decommission the legacy module

### Data Migration Scripts

- Located in: `scripts/migrations/` (per module)
- Read from legacy MySQL `cogdasma_db`, write to Supabase PostgreSQL
- Handle data transformations:
  - MD5 password hashes → Supabase Auth users (with Worker ID as identifier)
  - Legacy auto-increment IDs → preserved where needed for continuity
  - Data cleanup and normalization
- Include validation/checksum steps
- Idempotent — safe to re-run

---

## Notes

- The `worker` table is the central entity shared across both systems — it represents staff, mentors, and system users
- Many `*_view` tables in the schema are database views (not physical tables) used for reporting — these will be replaced by Supabase views or application-level queries
- The legacy MySQL database schema (`cogdasma_db-schema.sql`) is the source of truth for understanding current data structures — use it when designing the new PostgreSQL schema
- Reference legacy controller/model code for business rules, but implement them cleanly in the new stack
- The legacy C2S mobile app will be fully replaced — no backward-compatible API layer needed
- COG App is designed to grow — the initial scope is C2S + ORS features, but the architecture must support adding entirely new modules in the future
