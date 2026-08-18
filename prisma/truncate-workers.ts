/**
 * Clears out worker records so the ORS sync can repopulate them.
 *
 *   # 1. See what would happen — DELETES NOTHING (this is the default)
 *   npx tsx prisma/truncate-workers.ts
 *   npx tsx prisma/truncate-workers.ts --scope=all
 *
 *   # 2. Actually delete, once the dry-run numbers look right
 *   npx tsx prisma/truncate-workers.ts --confirm
 *   npx tsx prisma/truncate-workers.ts --scope=all --confirm
 *
 * Flags:
 *   --scope=ors   (default) only workers imported from ORS (`workerId` set)
 *   --scope=all             every worker row
 *   --confirm               perform the deletion; without it this is a dry run
 *   --include-superadmin    also delete the protected super-admin account
 *
 * THIS IS NOT REVERSIBLE. `Worker` sits at the centre of the schema — deleting
 * one takes its attendance history, schedules, leave records, training records,
 * meal stubs, bookings and approvals with it, because those rows are
 * meaningless without the worker and Postgres will refuse the delete otherwise.
 * Take a database backup first; nothing here can un-delete anything.
 *
 * Two deliberate safety properties:
 *   - Dry run by default. You have to pass --confirm to destroy anything.
 *   - `SUPERADMIN_EMAIL` (default njcarlo@gmail.com) is preserved unless you
 *     explicitly opt out, so a wipe can't lock you out of the app it runs
 *     against.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const CONFIRM = args.includes('--confirm');
const INCLUDE_SUPERADMIN = args.includes('--include-superadmin');
const SCOPE: 'ors' | 'all' =
  (args.find(a => a.startsWith('--scope='))?.split('=')[1] as 'ors' | 'all') ?? 'ors';
const SUPERADMIN_EMAIL = (process.env.SUPERADMIN_EMAIL || 'njcarlo@gmail.com').trim().toLowerCase();

if (SCOPE !== 'ors' && SCOPE !== 'all') {
  console.error(`Unknown --scope=${SCOPE}. Use "ors" or "all".`);
  process.exit(1);
}

/**
 * Dependent rows, in deletion order — children before parents. Anything with a
 * real FK to `Worker` must go first or Postgres rejects the worker delete;
 * `VenueBooking` needs its own children cleared before it, in turn.
 *
 * `MealStubLedger`, `WorshipSlotWorker`, `ScheduleAssignment` and
 * `EventAssignment` hold `workerId` as a plain string with no FK, so the
 * database would happily leave them dangling. They're cleared too — silent
 * orphans pointing at deleted workers are worse than the delete itself.
 */
type Client = any;

type Step = {
  label: string;
  count: (db: Client, ids: string[]) => Promise<number>;
  remove: (db: Client, ids: string[]) => Promise<{ count: number }>;
};

/**
 * Steps take the client as an argument rather than closing over the global one,
 * so the same definitions can be counted against `prisma` and deleted inside a
 * `$transaction` — a step that quietly ran outside the transaction would break
 * the all-or-nothing guarantee below.
 */
function simple(label: string, model: string, field: string): Step {
  return {
    label,
    count: (db, ids) => db[model].count({ where: { [field]: { in: ids } } }),
    remove: (db, ids) => db[model].deleteMany({ where: { [field]: { in: ids } } }),
  };
}

/** Same, for rows reached through a relation rather than a direct column. */
function nested(label: string, model: string, where: (ids: string[]) => object): Step {
  return {
    label,
    count: (db, ids) => db[model].count({ where: where(ids) }),
    remove: (db, ids) => db[model].deleteMany({ where: where(ids) }),
  };
}

const viaBooking = (ids: string[]) => ({ booking: { workerProfileId: { in: ids } } });

const STEPS: Step[] = [
  // VenueBooking's own dependents first (assistance requests hang off bookings).
  nested('VenueAuditLog (via assistance request)', 'venueAuditLog', (ids) => ({ request: viaBooking(ids) })),
  nested('AssistanceRequestItem', 'assistanceRequestItem', (ids) => ({ request: viaBooking(ids) })),
  nested('AssistanceRequest', 'assistanceRequest', viaBooking),

  simple('VenueBooking', 'venueBooking', 'workerProfileId'),
  simple('RecurringBooking', 'recurringBooking', 'workerProfileId'),
  simple('Booking', 'booking', 'workerProfileId'),
  simple('AttendanceRecord', 'attendanceRecord', 'workerProfileId'),
  simple('MasterScheduleOverride', 'masterScheduleOverride', 'workerId'),
  simple('MasterSchedule', 'masterSchedule', 'workerId'),
  simple('LeaveRequest', 'leaveRequest', 'workerId'),
  simple('LeaveBalance', 'leaveBalance', 'workerId'),
  simple('TrainingRecord', 'trainingRecord', 'workerId'),
  simple('WorkerAvailability', 'workerAvailability', 'workerId'),
  simple('MealStub', 'mealStub', 'workerId'),
  simple('ApprovalRequest', 'approvalRequest', 'workerId'),
  simple('InventoryBorrowing', 'inventoryBorrowing', 'borrowerId'),
  simple('InventoryLog', 'inventoryLog', 'workerId'),
  simple('NotificationPreference', 'notificationPreference', 'workerId'),
  simple('WorkerRole', 'workerRole', 'workerId'),

  // Soft references — no FK, so these would silently dangle if left behind.
  simple('MealStubLedger (no FK)', 'mealStubLedger', 'workerId'),
  simple('WorshipSlotWorker (no FK)', 'worshipSlotWorker', 'workerId'),
  simple('ScheduleAssignment (no FK)', 'scheduleAssignment', 'workerId'),
  simple('EventAssignment (no FK)', 'eventAssignment', 'workerId'),

  // C2S staff assignments hang off workerId with no FK. Groups themselves are
  // not deleted (they're the public Group Finder directory); mentorId on a
  // group/mentee is reported as a leftover rather than wiping C2S.
  simple('C2SCoordinatorAssignment (no FK)', 'c2SCoordinatorAssignment', 'workerId'),
  simple('C2SMentorAssignment (no FK)', 'c2SMentorAssignment', 'workerId'),
  {
    label: 'C2SCluster.clusterHeadId (null out)',
    count: (db, ids) => db.c2SCluster.count({ where: { clusterHeadId: { in: ids } } }),
    remove: (db, ids) =>
      db.c2SCluster.updateMany({
        where: { clusterHeadId: { in: ids } },
        data: { clusterHeadId: null },
      }),
  },
];

async function main() {
  const where =
    SCOPE === 'ors'
      ? { workerId: { not: null } }
      : {};

  const candidates = await prisma.worker.findMany({
    where,
    select: { id: true, email: true, workerId: true },
  });

  const protectedWorkers = INCLUDE_SUPERADMIN
    ? []
    : candidates.filter(w => (w.email || '').trim().toLowerCase() === SUPERADMIN_EMAIL);
  const protectedIds = new Set(protectedWorkers.map(w => w.id));
  const targets = candidates.filter(w => !protectedIds.has(w.id));
  const ids = targets.map(w => w.id);

  const totalWorkers = await prisma.worker.count();

  console.log(`\n${CONFIRM ? '🔥 DELETING' : '🔍 DRY RUN — nothing will be deleted'}`);
  console.log(`   scope:      ${SCOPE === 'ors' ? 'ORS-imported workers only (workerId set)' : 'ALL workers'}`);
  console.log(`   workers:    ${targets.length} of ${totalWorkers} total`);
  console.log(`   preserved:  ${protectedWorkers.length ? protectedWorkers.map(w => w.email).join(', ') : 'none'}\n`);

  if (ids.length === 0) {
    console.log('Nothing matches — exiting without changes.');
    return;
  }

  // Always report the dependent counts, dry run or not: they're the part that
  // surprises people, and they should be visible in the log of a real run too.
  let dependents = 0;
  const counts: Array<[string, number]> = [];
  for (const step of STEPS) {
    const n = await step.count(prisma, ids);
    dependents += n;
    if (n > 0) counts.push([step.label, n]);
  }

  console.log('Dependent rows that go with them:');
  if (counts.length === 0) {
    console.log('   (none)');
  } else {
    for (const [label, n] of counts) console.log(`   ${String(n).padStart(7)}  ${label}`);
  }
  console.log(`   ${String(dependents).padStart(7)}  TOTAL dependent rows\n`);

  // Groups/mentees keep their rows so the public directory survives a worker
  // wipe. mentorId is a required string with no FK, so those pointers will
  // dangle — surface the count so it isn't a surprise after the fact.
  const leftoverGroups = await prisma.c2SGroup.count({ where: { mentorId: { in: ids } } });
  const leftoverMentees = await prisma.c2SMentee.count({ where: { mentorId: { in: ids } } });
  if (leftoverGroups > 0 || leftoverMentees > 0) {
    console.log('C2S leftovers (not deleted — Group Finder directory stays):');
    if (leftoverGroups > 0) console.log(`   ${String(leftoverGroups).padStart(7)}  C2SGroup.mentorId will dangle`);
    if (leftoverMentees > 0) console.log(`   ${String(leftoverMentees).padStart(7)}  C2SMentee.mentorId will dangle`);
    console.log('');
  }

  if (!CONFIRM) {
    console.log('Re-run with --confirm to delete. Take a database backup first — this cannot be undone.');
    return;
  }

  // One transaction: a partial wipe would leave the DB in a state worse than
  // either outcome — some workers gone, their history stranded behind FKs.
  await prisma.$transaction(async (tx) => {
    for (const step of STEPS) {
      const res = await step.remove(tx, ids);
      if (res.count > 0) console.log(`   deleted ${res.count} ${step.label}`);
    }

    const res = await tx.worker.deleteMany({ where: { id: { in: ids } } });
    console.log(`   deleted ${res.count} Worker`);
  }, { timeout: 120_000 });

  console.log(`\n✅ Done. ${await prisma.worker.count()} worker(s) remain.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
