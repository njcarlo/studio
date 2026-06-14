import { prisma } from '@studio/database/prisma';
import { format } from 'date-fns';
import { writeAudit } from '@/lib/audit/log';
import { notify, notifyMany, SYSTEM_ACTOR } from '@/services/notification-center';
import { getEffectiveSchedule } from '@/services/master-schedule';
import { weekOf, getSundayConfirmationSettings, isWithinConfirmationWindow } from '@/services/meal-stub-engine';

/**
 * Scheduled jobs (Layer 5). Run daily via `/api/cron/daily-jobs` (Vercel
 * Cron). Each job is idempotent — safe to re-run if a cron invocation is
 * retried or missed and run late.
 */

const STUB_COST_PHP = 45;

function startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function endOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}

/**
 * Voids `MealStub` rows still `Issued` for a past date — covers both the
 * Sunday-EOD void of unused service stubs and the weekly weekday stub void
 * (3.1/5.4.4), since both are simply "Issued and the day has passed" once
 * this runs daily. Writes a negative `MealStubLedger` entry per stub so
 * reporting nets out to the actual redeemed count.
 */
export async function voidStaleMealStubs() {
    const todayStart = startOfDay(new Date());

    const staleStubs = await prisma.mealStub.findMany({
        where: { status: 'Issued', date: { lt: todayStart } },
    });
    if (staleStubs.length === 0) return { voided: 0 };

    await prisma.mealStub.updateMany({
        where: { id: { in: staleStubs.map((s) => s.id) } },
        data: { status: 'Void' },
    });

    for (const stub of staleStubs) {
        const worker = await prisma.worker.findUnique({
            where: { id: stub.workerId },
            select: { majorMinistryId: true },
        });
        const ministry = worker?.majorMinistryId
            ? await prisma.ministry.findUnique({ where: { id: worker.majorMinistryId }, select: { departmentCode: true } })
            : null;

        await prisma.mealStubLedger.create({
            data: {
                workerId: stub.workerId,
                ministryId: worker?.majorMinistryId,
                departmentCode: ministry?.departmentCode ?? null,
                slotType: stub.stubType ?? 'Standard',
                count: -1,
                costPhp: -STUB_COST_PHP,
                scheduleId: stub.scheduleId,
                weekOf: weekOf(stub.date),
                source: 'auto_void_unused',
            },
        });
    }

    await writeAudit({
        actor: SYSTEM_ACTOR, module: 'meal_stub', action: 'auto_void_unused_stubs',
        after: { count: staleStubs.length },
    });

    return { voided: staleStubs.length };
}

/**
 * For workers with an HR-managed `MasterSchedule`, flags yesterday as a
 * no-show if it wasn't a day off and no Clock In record exists. Notifies the
 * worker and their major ministry head.
 */
export async function flagNoShows() {
    const now = new Date();
    const todayStart = startOfDay(now);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dayStart = startOfDay(yesterday);
    const dayEnd = endOfDay(yesterday);

    const workers = await prisma.worker.findMany({
        where: { masterSchedule: { isNot: null }, status: 'Active' },
        select: { id: true, firstName: true, lastName: true, majorMinistryId: true },
    });

    let flagged = 0;
    for (const worker of workers) {
        const effective = await getEffectiveSchedule(worker.id, dayStart);
        if (!effective || effective.isDayOff) continue;

        const clockIn = await prisma.attendanceRecord.findFirst({
            where: { workerProfileId: worker.id, type: 'Clock In', time: { gte: dayStart, lte: dayEnd } },
        });
        if (clockIn) continue;

        // The audit row's timestamp is written as "now" (today), not the
        // flagged date — so idempotency is "have we already flagged this
        // worker's no-show on today's run", which is correct for a job that
        // runs at most once per day.
        const alreadyFlagged = await prisma.transactionLog.findFirst({
            where: { module: 'attendance', action: 'no_show_flag', targetId: worker.id, timestamp: { gte: todayStart } },
        });
        if (alreadyFlagged) continue;

        const ministry = await prisma.ministry.findUnique({ where: { id: worker.majorMinistryId }, select: { headId: true } });
        const workerName = `${worker.firstName} ${worker.lastName}`;

        await notifyMany([worker.id, ministry?.headId], {
            title: 'Missed clock-in',
            body: `${workerName} did not clock in on ${format(dayStart, 'PP')}.`,
            link: '/settings/attendance',
        });

        await writeAudit({
            actor: SYSTEM_ACTOR, module: 'attendance', action: 'no_show_flag',
            targetId: worker.id, targetName: workerName, after: { date: dayStart },
        });

        flagged++;
    }

    return { flagged };
}

/**
 * Reminds workers with a still-`Pending` assignment on a published schedule
 * to confirm attendance, while the confirmation window is still open.
 */
export async function sendUnconfirmedAssignmentReminders() {
    const settings = await getSundayConfirmationSettings();
    const now = new Date();
    const todayStart = startOfDay(now);

    const pending = await prisma.scheduleAssignment.findMany({
        where: {
            attendanceStatus: 'Pending',
            workerId: { not: null },
            schedule: { status: 'Published' },
        },
        include: { schedule: true },
    });

    let reminded = 0;
    for (const assignment of pending) {
        if (!assignment.workerId) continue;
        if (!isWithinConfirmationWindow(assignment.schedule.date, now, settings)) continue;

        const alreadyReminded = await prisma.transactionLog.findFirst({
            where: { module: 'schedule', action: 'unconfirmed_reminder', targetId: assignment.id, timestamp: { gte: todayStart } },
        });
        if (alreadyReminded) continue;

        await notify(assignment.workerId, {
            title: 'Confirm your assignment',
            body: `You're scheduled for ${assignment.roleName} on ${format(assignment.schedule.date, 'PP')}. Please confirm your attendance.`,
            link: '/my-schedule',
        });

        await writeAudit({
            actor: SYSTEM_ACTOR, module: 'schedule', action: 'unconfirmed_reminder',
            targetId: assignment.id, targetName: assignment.workerName ?? undefined,
            after: { scheduleDate: assignment.schedule.date },
        });

        reminded++;
    }

    return { reminded };
}

export async function runDailyJobs() {
    const [stubs, noShows, reminders] = await Promise.all([
        voidStaleMealStubs(),
        flagNoShows(),
        sendUnconfirmedAssignmentReminders(),
    ]);
    return { stubs, noShows, reminders };
}
