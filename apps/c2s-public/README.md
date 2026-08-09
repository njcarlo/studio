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

## Known gaps

- The C2S Hub application flow (`C2SHubModal` → coordinator inbox) still keeps
  its submissions in `localStorage`; it has no Prisma model yet.
- `avgAssignmentDays` on the coordinator cards is reported as `0` — the wait
  time isn't derived from the request timeline yet.
- Several report series (monthly growth, church-wide comparisons) remain
  illustrative constants rather than aggregates.
