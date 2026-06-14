import { prisma } from '@studio/database/prisma';

/**
 * Worker availability (SRD 5.2.2) — self-service blocks a worker sets on
 * themselves; consulted by the scheduler's eligible-worker search.
 */

export async function getAvailability(workerId: string) {
    return prisma.workerAvailability.findMany({
        where: { workerId },
        orderBy: [{ type: 'asc' }, { dayOfWeek: 'asc' }, { date: 'asc' }],
    });
}

/** Replaces all `Recurring` rows for `workerId` with the given days-of-week (0-6, Sun-Sat). */
export async function setRecurringUnavailability(workerId: string, days: number[]) {
    await prisma.$transaction([
        prisma.workerAvailability.deleteMany({ where: { workerId, type: 'Recurring' } }),
        prisma.workerAvailability.createMany({
            data: days.map((dayOfWeek) => ({ workerId, type: 'Recurring', dayOfWeek })),
        }),
    ]);
    return getAvailability(workerId);
}

export async function addOneTimeUnavailability(workerId: string, date: Date, note?: string) {
    return prisma.workerAvailability.create({
        data: { workerId, type: 'OneTime', date, note },
    });
}

export async function removeUnavailability(workerId: string, id: string) {
    return prisma.workerAvailability.deleteMany({ where: { id, workerId } });
}

/** Worker IDs unavailable on `date` (matches a `Recurring` day-of-week or a `OneTime` date). */
export async function getUnavailableWorkerIds(date: Date): Promise<Set<string>> {
    const dayOfWeek = date.getDay();
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const rows = await prisma.workerAvailability.findMany({
        where: {
            OR: [
                { type: 'Recurring', dayOfWeek },
                { type: 'OneTime', date: { gte: dayStart, lt: dayEnd } },
            ],
        },
        select: { workerId: true },
    });
    return new Set(rows.map((r) => r.workerId));
}
