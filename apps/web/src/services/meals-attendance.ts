import { prisma } from '@studio/database/prisma';
import type {
    CreateMealStubInput,
    UpdateMealStubInput,
    CreateAttendanceRecordInput,
} from '@/lib/schemas/meals-attendance.schemas';

// ── Meal Stubs ────────────────────────────────────────────────────────────────

export async function getMealStubs(filters: { workerId?: string; dateFrom?: Date; dateTo?: Date } = {}) {
    const where: any = {};
    if (filters.workerId) where.workerId = filters.workerId;
    if (filters.dateFrom || filters.dateTo) {
        where.date = {
            ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
            ...(filters.dateTo ? { lte: filters.dateTo } : {}),
        };
    }

    return prisma.mealStub.findMany({
        where,
        orderBy: { date: 'desc' },
    });
}

export async function createMealStub(data: CreateMealStubInput) {
    const stubDate = data.date || new Date();
    const dayStart = new Date(stubDate); dayStart.setHours(0, 0, 0, 0);
    const dayEnd   = new Date(stubDate); dayEnd.setHours(23, 59, 59, 999);

    const existingCount = await prisma.mealStub.count({
        where: { workerId: data.workerId, date: { gte: dayStart, lte: dayEnd } },
    });
    // Sundays allow up to 2 stubs per worker per day; every other day allows 1.
    const maxPerDay = stubDate.getDay() === 0 ? 2 : 1;
    if (existingCount >= maxPerDay) {
        throw new Error(`${data.workerName} already has ${existingCount} meal stub(s) for this date.`);
    }

    return prisma.mealStub.create({ data: { ...data, date: stubDate } });
}

export async function updateMealStub(id: string, data: UpdateMealStubInput) {
    return prisma.mealStub.update({ where: { id }, data });
}

export async function deleteMealStub(id: string) {
    await prisma.mealStub.delete({ where: { id } });
}

// ── Attendance ────────────────────────────────────────────────────────────────

export async function getAttendanceRecords(filters: { workerProfileId?: string; dateFrom?: Date; dateTo?: Date } = {}) {
    const where: any = {};
    if (filters.workerProfileId) where.workerProfileId = filters.workerProfileId;
    if (filters.dateFrom || filters.dateTo) {
        where.time = {
            ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
            ...(filters.dateTo ? { lte: filters.dateTo } : {}),
        };
    }

    return prisma.attendanceRecord.findMany({
        where,
        include: { worker: true },
        orderBy: { time: 'desc' },
    });
}

export async function createAttendanceRecord(data: CreateAttendanceRecordInput) {
    return prisma.attendanceRecord.create({
        data: {
            ...data,
            time: new Date(),
        },
    });
}
