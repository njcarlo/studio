import { prisma } from '@studio/database/prisma';
import { createMealstub } from '@/services/meal-stub-service';
import { writeAudit } from '@/lib/audit/log';
import type { CallerCtx } from '@/lib/auth/with-permission';
import { isWithinConfirmationWindow as isWithinConfirmationWindowShared, type SundayConfirmationSettings as SharedSundayConfirmationSettings } from '@/lib/scheduling/confirmation-window';

/**
 * Sunday Confirmation & Meal Stub Engine (SRD 5.7, 5.3.2, 5.4.1-5.4.3).
 *
 * Stub issuance happens at confirm-time (not publish-time): confirming a
 * `ScheduleAssignment` issues `MealStub` row(s) based on its `slotType`
 * (Standard=1, Main/Mid=2, Open=1 once a 2-Sunday pair is confirmed), subject
 * to a global weekly cap. Every issuance/void writes an append-only
 * `MealStubLedger` row for reporting (Layer 6).
 */

const COST_PER_STUB_PHP = 45;

// ── Settings (stored as generic `Setting` rows) ────────────────────────────

export type SundayConfirmationSettings = SharedSundayConfirmationSettings;

const DEFAULT_CONFIRMATION_SETTINGS: SundayConfirmationSettings = {
    windowOpenDaysBefore: 7,
    windowCloseHoursAfterMidnight: 24,
};

export type MealStubCapSettings = {
    weeklyCap: number;
};

const DEFAULT_CAP_SETTINGS: MealStubCapSettings = {
    weeklyCap: 2000,
};

export async function getSundayConfirmationSettings(): Promise<SundayConfirmationSettings> {
    const row = await prisma.setting.findUnique({ where: { id: 'sunday_confirmation' } });
    return { ...DEFAULT_CONFIRMATION_SETTINGS, ...(row?.data as object ?? {}) };
}

export async function updateSundayConfirmationSettings(
    ctx: Pick<CallerCtx, 'workerId' | 'email'>,
    data: Partial<SundayConfirmationSettings>,
) {
    const before = await getSundayConfirmationSettings();
    const after = {
        ...before,
        ...Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)),
    };
    await prisma.setting.upsert({
        where: { id: 'sunday_confirmation' },
        create: { id: 'sunday_confirmation', data: after },
        update: { data: after },
    });
    await writeAudit({
        actor: ctx, module: 'meal_stub', action: 'update_confirmation_settings',
        targetId: 'global', before, after,
    });
    return after;
}

export async function getMealStubCap(): Promise<MealStubCapSettings> {
    const row = await prisma.setting.findUnique({ where: { id: 'meal_stub_cap' } });
    return { ...DEFAULT_CAP_SETTINGS, ...(row?.data as object ?? {}) };
}

export async function updateMealStubCap(
    ctx: Pick<CallerCtx, 'workerId' | 'email'>,
    data: Partial<MealStubCapSettings>,
) {
    const before = await getMealStubCap();
    const after = {
        ...before,
        ...Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)),
    };
    await prisma.setting.upsert({
        where: { id: 'meal_stub_cap' },
        create: { id: 'meal_stub_cap', data: after },
        update: { data: after },
    });
    await writeAudit({
        actor: ctx, module: 'meal_stub', action: 'update_stub_cap',
        targetId: 'global', before, after,
    });
    return after;
}

// ── Pure helpers ─────────────────────────────────────────────────────────

/** Monday 00:00 of the week containing `date`. */
export function weekOf(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0=Sun..6=Sat
    const diffToMonday = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diffToMonday);
    return d;
}

export const isWithinConfirmationWindow = isWithinConfirmationWindowShared;

function daysBetween(a: Date, b: Date): number {
    return Math.round(Math.abs(a.getTime() - b.getTime()) / (24 * 60 * 60 * 1000));
}

// ── Weekly usage ─────────────────────────────────────────────────────────

export async function getWeeklyStubUsage(weekOfDate: Date, opts?: { ministryId?: string }): Promise<number> {
    const result = await prisma.mealStubLedger.aggregate({
        where: {
            weekOf: weekOfDate,
            ...(opts?.ministryId ? { ministryId: opts.ministryId } : {}),
        },
        _sum: { count: true },
    });
    return result._sum.count ?? 0;
}

// ── Issuance ─────────────────────────────────────────────────────────────

async function issueStubsForSchedule(params: {
    workerId: string;
    workerName: string;
    ministryId: string;
    scheduleId: string;
    scheduleDate: Date;
    slotType: string;
    count: number;
    assignedBy: string;
}): Promise<number> {
    const { workerId, workerName, ministryId, scheduleId, scheduleDate, slotType, count, assignedBy } = params;

    const cap = await getMealStubCap();
    const week = weekOf(scheduleDate);

    const ministry = await prisma.ministry.findUnique({
        where: { id: ministryId },
        select: { departmentCode: true, mealStubWeeklyLimit: true, headId: true, name: true },
    });

    const globalUsage = await getWeeklyStubUsage(week);
    const ministryUsage = ministry?.mealStubWeeklyLimit != null
        ? await getWeeklyStubUsage(week, { ministryId })
        : 0;

    const exceedsGlobal = globalUsage + count > cap.weeklyCap;
    const exceedsMinistry = ministry?.mealStubWeeklyLimit != null && ministryUsage + count > ministry.mealStubWeeklyLimit;

    if (exceedsGlobal || exceedsMinistry) {
        await notifyCapReached({ workerId, ministryName: ministry?.name, ministryHeadId: ministry?.headId });
        return 0;
    }

    for (let i = 0; i < count; i++) {
        await createMealstub({
            workerId,
            workerName,
            scheduleId,
            date: scheduleDate,
            status: 'Issued',
            stubType: slotType,
            assignedBy,
            assignedByName: 'System',
        });
    }

    await prisma.mealStubLedger.create({
        data: {
            workerId,
            ministryId,
            departmentCode: ministry?.departmentCode ?? null,
            slotType,
            count,
            costPhp: count * COST_PER_STUB_PHP,
            scheduleId,
            weekOf: week,
            source: 'sunday_confirm',
        },
    });

    return count;
}

async function notifyCapReached(params: { workerId: string; ministryName?: string; ministryHeadId?: string | null }) {
    const recipients = [params.workerId, ...(params.ministryHeadId ? [params.ministryHeadId] : [])];
    for (const userId of new Set(recipients)) {
        await prisma.inAppNotification.create({
            data: {
                userId,
                title: 'Meal stub cap reached',
                body: `The weekly meal stub cap${params.ministryName ? ` for ${params.ministryName}` : ''} has been reached. Attendance was still confirmed, but no meal stub was issued for this assignment.`,
            },
        }).catch((e) => console.error('[meal-stub-engine] failed to write cap notification:', e));
    }
}

/**
 * Called after a `ScheduleAssignment` transitions to `Confirmed`. Returns the
 * number of stubs issued for *this* assignment's schedule (0 if the cap was
 * reached, or if this is an `Open` slot whose pairing Sunday isn't confirmed
 * yet).
 */
export async function allocateStubsForConfirmation(ctx: CallerCtx, assignmentId: string): Promise<number> {
    const assignment = await prisma.scheduleAssignment.findUnique({
        where: { id: assignmentId },
        include: { schedule: true },
    });
    if (!assignment || !assignment.workerId || !assignment.workerName) return 0;

    const settings = await getSundayConfirmationSettings();
    if (!isWithinConfirmationWindow(assignment.schedule.date, new Date(), settings)) return 0;

    const base = {
        workerId: assignment.workerId,
        workerName: assignment.workerName,
        ministryId: assignment.ministryId,
        assignedBy: ctx.workerId,
    };

    let issuedForThis = 0;

    if (assignment.slotType === 'Main' || assignment.slotType === 'Mid') {
        issuedForThis = await issueStubsForSchedule({
            ...base,
            scheduleId: assignment.scheduleId,
            scheduleDate: assignment.schedule.date,
            slotType: assignment.slotType,
            count: 2,
        });
    } else if (assignment.slotType === 'Open') {
        // Find a Confirmed `Open` assignment for the same worker on the
        // adjacent Sunday (±7 days), without an existing stub for it yet.
        const candidates = await prisma.scheduleAssignment.findMany({
            where: {
                id: { not: assignment.id },
                workerId: assignment.workerId,
                slotType: 'Open',
                attendanceStatus: 'Confirmed',
            },
            include: { schedule: true },
        });
        const pair = candidates.find(c => daysBetween(c.schedule.date, assignment.schedule.date) === 7);

        if (pair) {
            const existingStubThis = await prisma.mealStub.findFirst({
                where: { workerId: assignment.workerId, scheduleId: assignment.scheduleId, stubType: 'Open' },
            });
            const existingStubPair = await prisma.mealStub.findFirst({
                where: { workerId: pair.workerId!, scheduleId: pair.scheduleId, stubType: 'Open' },
            });

            if (!existingStubThis) {
                issuedForThis = await issueStubsForSchedule({
                    ...base,
                    scheduleId: assignment.scheduleId,
                    scheduleDate: assignment.schedule.date,
                    slotType: 'Open',
                    count: 1,
                });
            }
            if (!existingStubPair) {
                await issueStubsForSchedule({
                    workerId: pair.workerId!,
                    workerName: pair.workerName!,
                    ministryId: pair.ministryId,
                    assignedBy: ctx.workerId,
                    scheduleId: pair.scheduleId,
                    scheduleDate: pair.schedule.date,
                    slotType: 'Open',
                    count: 1,
                });
            }
        }
        // No pair yet — issue 0 now; resolved when the pairing assignment is confirmed.
    } else {
        issuedForThis = await issueStubsForSchedule({
            ...base,
            scheduleId: assignment.scheduleId,
            scheduleDate: assignment.schedule.date,
            slotType: assignment.slotType,
            count: 1,
        });
    }

    await writeAudit({
        actor: ctx, module: 'meal_stub', action: 'sunday_confirm_stub_issued',
        targetId: assignment.workerId, targetName: assignment.workerName,
        after: { assignmentId, slotType: assignment.slotType, issued: issuedForThis },
    });

    return issuedForThis;
}

/**
 * Called when a previously `Confirmed` assignment moves to `Pending`/`Not
 * Attending`. Voids any `Issued` (not yet `Claimed`) MealStub rows created
 * for this assignment's schedule and writes a negative ledger entry.
 */
export async function voidStubsForConfirmation(ctx: CallerCtx, assignmentId: string): Promise<number> {
    const assignment = await prisma.scheduleAssignment.findUnique({
        where: { id: assignmentId },
        include: { schedule: true },
    });
    if (!assignment || !assignment.workerId) return 0;

    const stubs = await prisma.mealStub.findMany({
        where: {
            workerId: assignment.workerId,
            scheduleId: assignment.scheduleId,
            stubType: assignment.slotType,
            status: 'Issued',
        },
    });
    if (stubs.length === 0) return 0;

    await prisma.mealStub.deleteMany({ where: { id: { in: stubs.map(s => s.id) } } });

    const ministry = await prisma.ministry.findUnique({
        where: { id: assignment.ministryId },
        select: { departmentCode: true },
    });

    await prisma.mealStubLedger.create({
        data: {
            workerId: assignment.workerId,
            ministryId: assignment.ministryId,
            departmentCode: ministry?.departmentCode ?? null,
            slotType: assignment.slotType,
            count: -stubs.length,
            costPhp: -stubs.length * COST_PER_STUB_PHP,
            scheduleId: assignment.scheduleId,
            weekOf: weekOf(assignment.schedule.date),
            source: 'sunday_void',
        },
    });

    await writeAudit({
        actor: ctx, module: 'meal_stub', action: 'sunday_confirm_stub_voided',
        targetId: assignment.workerId, targetName: assignment.workerName ?? undefined,
        before: { assignmentId, slotType: assignment.slotType, voided: stubs.length },
    });

    return stubs.length;
}
