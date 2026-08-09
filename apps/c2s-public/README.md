# C2S — Connect2Souls

Next.js app for Connect2Souls: the anonymous public Group Finder plus the
signed-in dashboards for the four C2S roles.

**Canonical URL:** `https://c2s.{NEXT_PUBLIC_ROOT_DOMAIN}`
Default: **`https://c2s.cogdasma.app`**

- Local: `npm run dev:c2s-public` → http://localhost:9004
  (`NEXT_PUBLIC_MODULE_URL_C2S=http://localhost:9004`)
- Domain logic: `@studio/c2s`
- Platform: `@studio/core-engine` (permissions, approval engine, tenant branding)
- UI: `@studio/ui`

## Routes

| Route | Auth | What it does |
| --- | --- | --- |
| `/` | public | Landing page — live service schedule, C2S entry points |
| `/c2s-finder` | public | Featured + searchable group directory |
| `/c2s-finder/[id]` | public | Single group detail |
| `/group-finder` | public | Map-driven finder with barangay/day/age filters |
| `/about`, `/contact`, `/give` | public | Static content pages |
| `/login` | public | Firebase sign-in; mints the shared `fb_session` cookie |
| `/dashboard` | worker | Role-routed dashboard (see below) |
| `/api/auth/session` | — | ID-token → session-cookie exchange (POST) and sign-out (DELETE) |

## Roles

`getC2SUser()` (`src/lib/auth.ts`) derives the caller's role from real data,
in this order:

1. `mentorship:manage` permission or super admin → **ministry head**
2. `C2SCluster.clusterHeadId` → **cluster head**
3. `C2SCoordinatorAssignment` → **coordinator**
4. `C2SMentorAssignment` or an owned `C2SGroup` → **mentor**

A signed-in worker with none of these gets no dashboard.

## Data flow

Nothing in the UI reads static entity data. Each page is a server component:

```
page (server)  →  lib/dashboard-data.ts  →  @studio/c2s  →  @studio/core-engine + Prisma
                          ↓
                  lib/adapters.ts (row → view type)
                          ↓
                  components/*View.tsx (client, props only)
```

Writes go the other way through `src/actions/c2s.ts`, gated by
`withPublicAction` (anonymous) or `withC2SRole` (`src/actions/guard.ts`) for
the assignment-derived roles that a single permission key can't express.

`src/lib/data.ts` keeps only the view types and genuinely static reference
data — barangays and their subdivisions, demographic tag colours, service
times.

## Env

```bash
DATABASE_URL=...
DIRECT_URL=...

# Firebase Auth — same project as apps/web, so the fb_session cookie is shared
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# White-label / module hosts  →  https://[module].[domain].app
NEXT_PUBLIC_ROOT_DOMAIN=cogdasma.app
NEXT_PUBLIC_BRAND_NAME="Church of God Dasmariñas"
NEXT_PUBLIC_BRAND_SHORT="COG Dasma"
NEXT_PUBLIC_BRAND_LOGO_URL=/cog-logo.png
NEXT_PUBLIC_BRAND_PRIMARY=#f43f5e
TENANT_ID=cog-dasma

# Local only
# NEXT_PUBLIC_MODULE_URL_C2S=http://localhost:9004
```

Server-side Firebase Admin uses `GOOGLE_APPLICATION_CREDENTIALS` when set and
Application Default Credentials otherwise (App Hosting / Cloud Run).

## C2S Hub applications

A household offering to host a group submits the **Bring C2S in My Home** form.
Those applications live in Firestore (`c2sHubApplications`), not Postgres: an
application is an inbound form submission a coordinator triages, not a record
the relational C2S model refers to. Once approved, the coordinator creates the
actual `C2SGroup` and the Prisma-side lifecycle takes over.

Reads and writes go through the Admin SDK in server actions only —
`firestore.rules` denies the collection to clients outright.

## Report series

Every chart is an aggregate computed in `@studio/c2s`'s `reports.ts`, scoped to
what the asking role can see:

| Series | Source |
| --- | --- |
| Monthly growth | cumulative `C2SMentee.createdAt` / `C2SMentorAssignment.dateAssigned` |
| Assignment trend | join requests by month, split on whether a mentor was assigned |
| Monthly potential | join requests by month of submission |
| Per barangay | active mentees grouped by their group's barangay |
| Per mentor | active mentees grouped by mentor |
| Church-wide | workers, mentors, mentees and groups by `Department`, attributing each group to its mentor's department |

The face-to-face vs online split reads `C2SGroup.meetingMode`, a separate axis
from `groupType` (Community- vs Church-based).

Coordinator turnaround (`avgAssignmentDays`) is measured from the pipeline
timeline columns on `C2SJoinRequest` — `assignedCoordinatorAt` to
`assignedMentorAt`, counting still-unassigned requests up to now so a growing
backlog raises the figure rather than hiding in the unresolved set.

## Testing locally

The app runs end to end against Postgres plus the Firebase emulators:

```bash
firebase emulators:start --only auth,firestore --project demo-c2s
# .env.local: FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
#             FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
#             NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true
npm run dev:c2s-public
```
