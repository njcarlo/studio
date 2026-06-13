import { prisma } from '@studio/database/prisma';

// ── Settings ─────────────────────────────────────────────────────────────────

export async function getAttendanceSetting() {
    return prisma.attendanceSetting.upsert({
        where: { id: 'global' },
        update: {},
        create: { id: 'global', gracePeriodMinutes: 15 },
    });
}

export async function updateAttendanceSetting(gracePeriodMinutes: number, updatedBy: string) {
    return prisma.attendanceSetting.upsert({
        where: { id: 'global' },
        update: { gracePeriodMinutes, updatedBy },
        create: { id: 'global', gracePeriodMinutes, updatedBy },
    });
}

// ── Master Schedule ──────────────────────────────────────────────────────────

export async function getMasterSchedules() {
    return prisma.masterSchedule.findMany({
        include: { worker: { select: { id: true, firstName: true, lastName: true, employmentType: true, avatarUrl: true } } },
        orderBy: { worker: { firstName: 'asc' } },
    });
}

export async function getMasterSchedule(workerId: string) {
    return prisma.masterSchedule.findUnique({ where: { workerId } });
}

export async function upsertMasterSchedule(input: {
    workerId: string;
    shiftStart: string;
    shiftEnd: string;
    daysOff: number[];
    updatedBy: string;
}) {
    return prisma.masterSchedule.upsert({
        where: { workerId: input.workerId },
        update: {
            shiftStart: input.shiftStart,
            shiftEnd: input.shiftEnd,
            daysOff: input.daysOff,
            updatedBy: input.updatedBy,
        },
        create: {
            workerId: input.workerId,
            shiftStart: input.shiftStart,
            shiftEnd: input.shiftEnd,
            daysOff: input.daysOff,
            updatedBy: input.updatedBy,
        },
    });
}

export async function deleteMasterSchedule(workerId: string) {
    await prisma.masterSchedule.delete({ where: { workerId } }).catch(() => null);
}

// ── Per-date overrides (written by approved ChangeTime/ChangeDayOff leave requests) ──

export async function upsertMasterScheduleOverride(input: {
    workerId: string;
    date: Date;
    shiftStart?: string | null;
    shiftEnd?: string | null;
    isDayOff?: boolean;
    reason?: string;
    sourceType?: string;
    sourceId?: string;
}) {
    const date = startOfDay(input.date);
    return prisma.masterScheduleOverride.upsert({
        where: { workerId_date: { workerId: input.workerId, date } },
        update: {
            shiftStart: input.shiftStart ?? null,
            shiftEnd: input.shiftEnd ?? null,
            isDayOff: input.isDayOff ?? false,
            reason: input.reason,
            sourceType: input.sourceType,
            sourceId: input.sourceId,
        },
        create: {
            workerId: input.workerId,
            date,
            shiftStart: input.shiftStart ?? null,
            shiftEnd: input.shiftEnd ?? null,
            isDayOff: input.isDayOff ?? false,
            reason: input.reason,
            sourceType: input.sourceType,
            sourceId: input.sourceId,
        },
    });
}

// ── Effective schedule resolution ───────────────────────────────────────────

export type EffectiveSchedule = {
    isDayOff: boolean;
    shiftStart: string | null;
    shiftEnd: string | null;
};

function startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

/** The shift (or day-off status) that applies to `workerId` on `date`, after applying any override. */
export async function getEffectiveSchedule(workerId: string, date: Date): Promise<EffectiveSchedule | null> {
    const day = startOfDay(date);

    const [schedule, override] = await Promise.all([
        prisma.masterSchedule.findUnique({ where: { workerId } }),
        prisma.masterScheduleOverride.findUnique({ where: { workerId_date: { workerId, date: day } } }),
    ]);

    if (!schedule) return null;

    const dayOfWeek = day.getDay();
    return {
        isDayOff: override?.isDayOff ?? schedule.daysOff.includes(dayOfWeek),
        shiftStart: override?.shiftStart ?? schedule.shiftStart,
        shiftEnd: override?.shiftEnd ?? schedule.shiftEnd,
    };
}

// ── Attendance recording with late-flagging ─────────────────────────────────

export async function recordAttendanceWithLateCheck(workerProfileId: string, type: 'Clock In' | 'Clock Out') {
    const now = new Date();
    let isLate = false;
    let lateMinutes: number | null = null;

    if (type === 'Clock In') {
        const effective = await getEffectiveSchedule(workerProfileId, now);
        if (effective && !effective.isDayOff && effective.shiftStart) {
            const setting = await getAttendanceSetting();
            const [h, m] = effective.shiftStart.split(':').map(Number);
            const shiftStartToday = new Date(now);
            shiftStartToday.setHours(h, m, 0, 0);

            const graceMs = setting.gracePeriodMinutes * 60 * 1000;
            const diffMs = now.getTime() - (shiftStartToday.getTime() + graceMs);
            if (diffMs > 0) {
                isLate = true;
                lateMinutes = Math.round(diffMs / 60000);
            }
        }
    }

    const record = await prisma.attendanceRecord.create({
        data: { workerProfileId, type, time: now, isLate, lateMinutes },
    });

    if (type === 'Clock In') {
        await ensureWeekdayMealStub(workerProfileId, now);
    }

    return record;
}

// ── Weekday meal stub allocation (SRD 5.4.4, 5.5.3) ─────────────────────────

const WEEKDAY_STUB_TYPE = 'Weekday';

/**
 * Issues today's weekday meal stub for an FT/OC worker on Clock In, unless
 * the day is a day off (MasterSchedule.daysOff, or an approved-leave override
 * via MasterScheduleOverride) or a stub for that date already exists.
 */
export async function ensureWeekdayMealStub(workerProfileId: string, date: Date) {
    const worker = await prisma.worker.findUnique({
        where: { id: workerProfileId },
        select: { firstName: true, lastName: true, employmentType: true },
    });
    if (!worker) return null;
    if (worker.employmentType !== 'Full-Time' && worker.employmentType !== 'On-Call') return null;

    const effective = await getEffectiveSchedule(workerProfileId, date);
    if (!effective || effective.isDayOff) return null;

    const dayStart = startOfDay(date);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const existing = await prisma.mealStub.findFirst({
        where: { workerId: workerProfileId, date: { gte: dayStart, lte: dayEnd } },
    });
    if (existing) return existing;

    return prisma.mealStub.create({
        data: {
            workerId: workerProfileId,
            workerName: `${worker.firstName} ${worker.lastName}`,
            date: dayStart,
            status: 'Issued',
            stubType: WEEKDAY_STUB_TYPE,
        },
    });
}

// ── Incomplete time-out resolution (HR) ─────────────────────────────────────

const INCOMPLETE_TIMEOUT_LOOKBACK_DAYS = 14;

/** Clock-In records (excluding today) with no matching Clock-Out the same day. */
export async function getIncompleteTimeOuts() {
    const since = startOfDay(new Date());
    since.setDate(since.getDate() - INCOMPLETE_TIMEOUT_LOOKBACK_DAYS);
    const today = startOfDay(new Date());

    const clockIns = await prisma.attendanceRecord.findMany({
        where: { type: 'Clock In', time: { gte: since, lt: today } },
        include: { worker: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
        orderBy: { time: 'desc' },
    });

    const incomplete = [];
    for (const clockIn of clockIns) {
        const dayStart = startOfDay(clockIn.time);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const clockOut = await prisma.attendanceRecord.findFirst({
            where: { workerProfileId: clockIn.workerProfileId, type: 'Clock Out', time: { gte: dayStart, lte: dayEnd } },
        });
        if (!clockOut) incomplete.push(clockIn);
    }
    return incomplete;
}

export async function resolveIncompleteTimeOut(clockInId: string, clockOutTime: Date) {
    const clockIn = await prisma.attendanceRecord.findUniqueOrThrow({ where: { id: clockInId } });
    return prisma.attendanceRecord.create({
        data: { workerProfileId: clockIn.workerProfileId, type: 'Clock Out', time: clockOutTime },
    });
}
