# C2S deployment checklist

What has to happen for `apps/c2s-public` to serve after PR #35. Work through it
in order; each step tells you how to confirm it worked.

## 1. Fix `DIRECT_URL` first

This is the one that silently blocks everything else.

Supabase no longer publishes an IPv4 address for `db.<ref>.supabase.co`:

```
$ getent ahostsv4 db.<ref>.supabase.co
(nothing — AAAA only)
```

Anything on an IPv4-only network — GitHub Actions runners, Cloud Run, App
Hosting build steps, most corporate networks — cannot resolve it, so
`prisma migrate deploy` fails before it touches the database. If migrations
have "never seemed to run", this is usually why.

Use the **session pooler** instead. Same credentials, dual-stack host, port
5432:

```bash
# Wrong — IPv6 only
DIRECT_URL="postgresql://postgres:PW@db.<ref>.supabase.co:5432/postgres"

# Right — session pooler, resolves on IPv4
DIRECT_URL="postgresql://postgres.<ref>:PW@aws-1-<region>.pooler.supabase.com:5432/postgres"
```

Note the username differs: the pooler wants `postgres.<ref>`, not `postgres`.

`DATABASE_URL` stays on the transaction pooler (6543, `?pgbouncer=true`) — that
is correct for runtime queries and must not be used for DDL.

Confirm:

```bash
psql "$DIRECT_URL" -c "select current_user, current_database();"
```

## 2. Apply the C2S migrations

Three migrations ship with PR #35:

| Migration | Adds |
| --- | --- |
| `20260809010000_c2s_hierarchy` | clusters, coordinator/mentor assignments, trainings, devotions, group directory fields, mentee profile, pipeline fields |
| `20260809020000_c2s_pipeline_timeline` | `assignedCoordinatorAt`, `assignedMentorAt`, `acceptedAt` + backfill |
| `20260809030000_c2s_meeting_mode` | `C2SGroup.meetingMode` |

**Prefer `npm run migrate:c2s` over `prisma migrate deploy`.**

`prisma migrate deploy` replays the entire `prisma/migrations` history and is
only safe when `_prisma_migrations` already lists every earlier migration. On a
database migrated by hand or restored from a dump, that table is missing or
incomplete and deploy will try to recreate tables that already hold data.

Check which situation you are in:

```sql
select count(*) from _prisma_migrations;   -- errors if the table is absent
```

Either way, this is safe:

```bash
npm run migrate:c2s -- --dry   # report what is missing, change nothing
npm run migrate:c2s            # apply
npx prisma generate            # regenerate the client afterwards
```

The runner needs nothing installed beyond what the repo already ships — it
goes through the Prisma client, so a plain `npm ci` is enough.

It applies only the three C2S migrations, each in its own transaction,
and prints the before/after state of every table and column it expects. The SQL
is idempotent — `IF NOT EXISTS` throughout, foreign keys guarded against
`duplicate_object`, and the backfill only fills `NULL`s — so re-running it
cannot duplicate a constraint or overwrite a timestamp recorded since the first
run. It refuses to run through the transaction pooler.

If you would rather use Prisma and the history *is* intact:

```bash
npx prisma migrate deploy
```

## 3. Set the App Hosting secrets

`apps/c2s-public/apphosting.yaml` expects these to exist in Secret Manager:

- `DATABASE_URL`, `DIRECT_URL`
- `NEXT_PUBLIC_FIREBASE_API_KEY`, `..._AUTH_DOMAIN`, `..._PROJECT_ID`,
  `..._STORAGE_BUCKET`, `..._MESSAGING_SENDER_ID`, `..._APP_ID`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`

The Firebase ones are new with this app — sign-in fails without them, though
the build still succeeds, so the failure only shows up at runtime.

Leave `GOOGLE_APPLICATION_CREDENTIALS` **unset** in App Hosting. It is for local
development only; on Cloud Run the Admin SDK uses Application Default
Credentials, and pointing the variable at a file that isn't there breaks its
startup.

## 4. Seed the hierarchy

The dashboards read from `C2SCluster` and the assignment tables, which start
empty. Until at least one cluster exists with its people attached:

- the ministry-head view has nothing to roll up
- a worker with no assignment gets no dashboard at all and is bounced to `/login`

Minimum viable data:

```sql
-- one cluster, headed by a worker
insert into "C2SCluster" (id, name, barangays, "clusterHeadId", "updatedAt")
values (gen_random_uuid(), 'Outreach Cluster 1', '{Burol}', '<worker-id>', now());

-- a coordinator and a mentor on it
insert into "C2SCoordinatorAssignment" (id, "workerId", "clusterId")
values (gen_random_uuid(), '<worker-id>', '<cluster-id>');

insert into "C2SMentorAssignment" (id, "workerId", "clusterId", "groupCapacity")
values (gen_random_uuid(), '<worker-id>', '<cluster-id>', 12);

-- point existing groups at the cluster
update "C2SGroup" set "clusterId" = '<cluster-id>' where "clusterId" is null;
```

Role resolution, for reference (`apps/c2s-public/src/lib/auth.ts`):

1. `mentorship:manage` permission or super admin → ministry head
2. `C2SCluster.clusterHeadId` → cluster head
3. a `C2SCoordinatorAssignment` → coordinator
4. a `C2SMentorAssignment`, or owning a `C2SGroup` → mentor

## 5. Existing groups need directory fields

Groups created before this change have no `barangay`, `leaderName`,
`description` or map coordinates. They still appear in the finder, but with
blank fields and a pin defaulted to the centre of Dasmariñas. Fill them in
through the mentor dashboard or with SQL.

## 6. Worker ID first login

Only works for workers who still carry a `legacyPasswordHash`. Anyone already
migrated, or created directly in the new system, must use the email form — the
Worker ID tab will tell them so and pre-fill their address.

Check who can still use it:

```sql
select count(*) from "Worker" where "legacyPasswordHash" is not null;
```

The claim is one-time per worker: it writes their chosen email, clears the
legacy hash and stamps `legacyMigratedAt`.

## 7. Smoke test

```bash
npm run build:c2s-public
```

Then against the deployed app:

- `/c2s-finder` lists groups from the database
- a join request from `/group-finder` creates a `C2SJoinRequest` **and** an
  `ApprovalWorkflow` of type `C2S Join Request`, and emails the group's mentor
- `/dashboard` redirects to `/login` when signed out
- each of the four roles reaches its dashboard
