# Resetting worker data (and the super-admin seed)

Two operational scripts that go together: one grants an account super-admin,
the other clears worker records so the ORS sync can repopulate them.

Both need `DATABASE_URL` / `DIRECT_URL` in the environment:

```bash
set -a && source apps/web/.env.local && set +a
```

## Grant super-admin

```bash
npm run seed:superadmin
# or target another account
SUPERADMIN_EMAIL=someone@example.com npm run seed:superadmin
```

Defaults to `njcarlo@gmail.com`. Idempotent — every write is an upsert, so it's
safe to re-run at any time, and it's worth re-running after a worker wipe.

It seeds the permission registry, ensures an `admin` role with
`isSuperAdmin = true` holding every permission, ensures the `Worker` row exists,
and assigns the role through both `WorkerRole` and the legacy `Worker.roleId`.

It does **not** create the Firebase Auth user. `requirePermission` resolves the
caller by session email and then looks up the Worker, so the account must
already be able to sign in (Google sign-in works out of the box for a Gmail
address). The seed only decides what that identity may do once signed in.

## Clear worker records

> **Take a database backup first.** Nothing here can be undone.

```bash
# 1. Dry run — reports what would be deleted, changes nothing
npm run workers:truncate:dry
npx tsx prisma/truncate-workers.ts --scope=all

# 2. Delete, once the numbers look right
npm run workers:truncate
npx tsx prisma/truncate-workers.ts --scope=all --confirm
```

| Flag | Effect |
|---|---|
| `--scope=ors` | *(default)* only workers imported from ORS (`workerId` set) |
| `--scope=all` | every worker row |
| `--confirm` | actually delete; without it the script is a dry run |
| `--include-superadmin` | also delete the protected super-admin account |

### What gets deleted with them

`Worker` sits at the centre of the schema. Postgres won't delete a worker while
anything references it, so the script clears dependents first — in FK-safe
order, all inside one transaction so a failure can't leave a half-wiped
database:

Venue audit logs → assistance request items → assistance requests →
venue bookings → recurring bookings → bookings → attendance records →
master schedule overrides → master schedules → leave requests →
leave balances → training records → worker availability → meal stubs →
approval requests → inventory borrowings → inventory logs →
notification preferences → worker roles → **workers**

`MealStubLedger`, `WorshipSlotWorker`, `ScheduleAssignment`,
`EventAssignment`, `C2SCoordinatorAssignment` and `C2SMentorAssignment` hold
`workerId` as a plain string with no foreign key. The database would happily
leave those rows pointing at deleted workers, so the script clears them too —
silent orphans are worse than the delete itself. `C2SCluster.clusterHeadId` is
nulled rather than deleting the cluster.

C2S **groups and mentees are not deleted**. They're the public Group Finder
directory, and wiping them as a side-effect of a worker reset would be the
wrong surprise. The dry run still reports how many `C2SGroup.mentorId` /
`C2SMentee.mentorId` pointers will dangle, so you can reassign mentors
afterwards.

**This means a wipe takes attendance history, leave records and training records
with it.** That's usually the surprise. Run the dry run and read the counts
before deciding whether that's what you want.

### Repopulating

Worker records come back from ORS, either from `/settings/ors-sync` → Workers
(row-by-row review) or from the weekly job, which imports new workers by default
— see the scheduled-jobs section of `APPHOSTING_DEPLOY.md`.

The super-admin account is preserved by default, so you keep access to the app
you just wiped. If you passed `--include-superadmin`, re-run
`npm run seed:superadmin` afterwards to get back in.
