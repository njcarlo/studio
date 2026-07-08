---
name: db-performance
description: Find and fix heavy/slow database reads in the studio monorepo — missing indexes, unbounded fetches, ILIKE search at scale, and when (rarely) to write a Postgres function instead of just indexing.
version: 1.0.0
source: manual
---

# DB Performance — Query Analysis & Indexing

Use this when a list/search page is slow, a table is approaching or past
~10-20k rows, or you're asked to "optimize", "add indexing", or "improve
fetch performance" for a module.

---

## Step 1 — Find the heavy query

Queries live in two places:
- `apps/web/src/actions/db.ts` — most `findMany`/`$queryRaw` calls
- `apps/web/src/services/*.ts` — domain logic, sometimes with its own Prisma calls

```bash
grep -n "prisma.<model>.findMany\|prisma.<model>.count\|\$queryRaw" apps/web/src/actions/db.ts apps/web/src/services/*.ts
```

Red flags, in rough order of severity:
1. `findMany` with **no `take`/pagination** on a table that isn't tiny (rosters/pickers are an accepted exception — see Step 4).
2. A `WHERE` filter (status, date range, foreign key) on a column with **no index** — check `prisma/schema.prisma` `@@index` blocks AND `supabase/migrations/*.sql` (indexes here are often added without ever updating `schema.prisma` — the SQL migrations are the source of truth, not the Prisma schema).
3. `contains`/`ILIKE` search (`mode: 'insensitive'`) on a plain column — a btree index can't accelerate substring search; needs `pg_trgm`.
4. Two round trips for one logical read (e.g. a separate `count` + `findMany` that could be one query with `COUNT(*) OVER()`).
5. `include`/nested relations fetched for every row when the UI only needs 2-3 fields from the relation (use `select`, not `include`).

## Step 2 — Check what already exists before adding anything

Don't add a duplicate/overlapping index. Grep existing migrations for the table first:

```bash
grep -rln '"<TableName>"' supabase/migrations/
```

Known precedent in this repo (read these before writing a new migration —
they show the established style: `CREATE INDEX IF NOT EXISTS`, partial
indexes with `WHERE`, and composite column order matching the query's filter
order):
- `supabase/migrations/20260531000002_performance_indexes.sql` — `Worker(status, majorMinistryId, minorMinistryId)`, `Booking(roomId, start, end) WHERE status != 'Cancelled'`, `ApprovalRequest(workerId, status)`
- `supabase/migrations/20260616000000_schedule_perf_indexes.sql` — `ServiceSchedule(date)`, `ScheduleAssignment(workerId)`, `ScheduleAssignment(scheduleId, ministryId, order)`
- `supabase/migrations/20260628110920_booking_worker_perf.sql` — full `Booking` filter-column coverage + `pg_trgm` GIN indexes on `Worker` name/workerId columns + two Postgres functions (see Step 3 for when those were justified)

A partial index (`WHERE status != 'Cancelled'`) only gets used by queries
whose `WHERE` clause provably implies that condition — if a query has no
status filter at all, it needs its own unrestricted composite index even if
a partial one already covers the filtered case. Don't assume an existing
index makes a new one redundant without checking this.

## Step 3 — Fix in this order (cheapest/safest first)

1. **Add the missing index.** This fixes the large majority of "heavy read at
   scale" problems on its own. New migration file:
   `supabase/migrations/YYYYMMDDHHMMSS_<module>_perf.sql`, using
   `CREATE INDEX IF NOT EXISTS`. Column order = most selective / most-filtered-on
   column first, matching how the query actually filters.

   **On a table with 10-20k+ rows that takes live write traffic** (Booking,
   Worker), prefer `CREATE INDEX CONCURRENTLY IF NOT EXISTS` — plain
   `CREATE INDEX` holds a lock that blocks writes for the whole build.
   Tradeoffs: `CONCURRENTLY` cannot run inside a transaction block, so it
   needs its own migration file with nothing else in it (confirm how the
   migration is applied — if the runner wraps the whole file in one
   transaction, `CONCURRENTLY` fails with "cannot run inside a transaction
   block"), and if the build is interrupted it can leave an `INVALID` index
   behind that still takes space and must be dropped and retried (see
   "Rolling back a change" below). The existing precedent migrations here
   (`20260531000002`, `20260616000000`, `20260628110920`) all use plain
   `CREATE INDEX IF NOT EXISTS` — acceptable for an off-peak manual apply,
   but call this tradeoff out to the user rather than silently copying it
   for a table under live write load.
2. **Trigram index for substring search.** Any `contains`/ILIKE search at
   scale needs:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   CREATE INDEX IF NOT EXISTS idx_<table>_<col>_trgm ON "<Table>" USING gin ("<col>" gin_trgm_ops);
   ```
3. **Only write a Postgres function when indexing alone doesn't fix it** —
   specifically: merging a count+select into one round trip via
   `COUNT(*) OVER()`, or moving boundary/date math into SQL so it can use an
   index that JS-side date arithmetic couldn't. Don't write a function "to
   have one" — it adds a second place business logic can drift from the
   TS layer. `fn_room_bookings_for_date` and `fn_workers_search` in
   `20260628110920_booking_worker_perf.sql` are the reference examples.
4. **Keep the TS function's signature and return shape unchanged** when
   swapping its internals to call a new index/function. Grep every importer
   first:
   ```bash
   grep -rl "from '@/actions/db'" apps/web/src --include="*.ts" --include="*.tsx"
   ```
   If the shape doesn't change, none of those callers need touching.

## Step 4 — Unbounded fetch-all is sometimes correct, not a bug

`getWorkers()` / `getWorkersLite()` / `getWorkersForScanner()` intentionally
fetch every row for roster pickers and client-side search widgets — that's a
deliberate tradeoff (see `studio-patterns.md` §"Large Table Performance"),
not a missed pagination case. Don't "fix" these into paginated endpoints
unless asked — check whether the caller is a calendar/picker that genuinely
needs the full filtered set before assuming a `findMany` with no `take` is a
bug.

## Step 5 — Verify, and flag what you can't verify

There's no local `psql`/Docker Postgres in this environment — a new
migration file's syntax can be traced by hand but not executed locally.
Before saying the work is done:
- Run `tsc --noEmit` on the changed file (and confirm the only remaining
  errors are pre-existing/unrelated).
- Confirm via grep that every caller of the changed function still matches
  its return shape.
- **Do not run `npx supabase db push` or otherwise apply the migration to
  the live database yourself** — schema changes to a shared/production DB
  need explicit user confirmation. State clearly that the migration file
  exists but is unapplied, and how the user applies it.

If the user has applied the migration (or can run SQL themselves, e.g. via
the Supabase SQL editor), confirm the index is actually used rather than
assuming it from the migration alone:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM "Booking" WHERE "roomId" = '...' AND "start" >= now();
```

Look for `Index Scan`/`Bitmap Index Scan` on the new index name in the plan.
A `Seq Scan` on a table with 10k+ rows means the index isn't being picked up
— common causes: the query shape doesn't match the index's leading
column(s), a function/cast wraps the indexed column (e.g. `LOWER(email)`
needs an index on `LOWER(email)`, not `email`), or Postgres's planner
estimates the table is small enough that a seq scan is still cheaper (true
right after creating the index on a freshly-seeded table before `ANALYZE`
has run — run `ANALYZE "TableName";` once after a bulk index/data change).
`EXPLAIN ANALYZE` actually executes the query — only run it with `SELECT`,
never with a statement that writes data.

## Write-path performance (batching, transactions, N+1)

Indexes fix reads; writes need a different set of habits:
- **Batch instead of looping.** `WorkersService.assignRolesToWorker`
  (`apps/web/src/services/workers.ts`) is the reference pattern: it deletes
  removed roles with one `deleteMany`, inserts added roles with one
  `createMany({ skipDuplicates: true })`, and wraps both in
  `prisma.$transaction` — not a loop of per-row `create`/`delete` calls.
- **N+1 already exists in this codebase — don't assume it doesn't.**
  `apps/web/src/services/ors-sync.ts` has several `for` loops that `await`
  a `findFirst` and then a `create`/`update` per iteration (e.g. lines
  ~668-690, ~742-818, ~860-885). It's an external-sync batch job, not a
  hot user-facing path, so it hasn't been urgent — but if asked to optimize
  that module, the fix is to pre-fetch with one `findMany({ where: { id: {
  in: [...] } } })` into a `Map`, then loop in memory and issue only the
  necessary writes (ideally via `createMany`/`updateMany`).
- Detect this shape with:
  ```bash
  grep -n "for (\|\.forEach(\|\.map(" -A 6 <file> | grep "await prisma\."
  ```
- Multi-step writes that must succeed or fail together (e.g. update a
  `Booking` and sync an approval workflow) belong in `prisma.$transaction`
  — see `approval-engine.ts:97` for the existing pattern.

## Postgres functions and Row-Level Security

This Supabase project uses RLS as a defense-in-depth layer behind Prisma
(see `docs/architecture.md` §1) — Prisma's connection typically runs as a
privileged role that bypasses RLS, so a new `fn_*` function called only
from `actions/db.ts`/`services/*.ts` usually isn't RLS-relevant. It becomes
relevant the moment a function might be called through a path that *is*
subject to RLS (PostgREST, a Supabase client call from public/anon code).
Functions default to `SECURITY INVOKER` (runs as the calling role, RLS
still applies) — leave them that way. Don't switch a function to
`SECURITY DEFINER` just to make an RLS denial go away without first
understanding why that table is locked down; that quietly punches a hole
in the defense-in-depth layer instead of fixing the actual access-control
decision.

## Rolling back a change

```sql
DROP INDEX CONCURRENTLY IF EXISTS idx_name;
DROP FUNCTION IF EXISTS fn_name(arg_type, arg_type, ...);
```

If a `CREATE INDEX CONCURRENTLY` build was interrupted, it can leave an
`INVALID` index that still occupies space and is never used by the planner.
Find it with `SELECT indexrelid::regclass FROM pg_index WHERE NOT
indisvalid;` and drop it before retrying.
