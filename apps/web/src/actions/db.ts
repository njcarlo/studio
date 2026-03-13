"use server";

import { prisma } from '@studio/database/prisma';
import { revalidatePath } from 'next/cache';
import { NotificationService } from '@/services/notification-service';

// --- Roles ---

export async function getRoles() {
    return await prisma.role.findMany({
        orderBy: {
            name: 'asc',
        },
    });
}

export async function getRoleById(id: string) {
    return await prisma.role.findUnique({
        where: { id },
    });
}

export async function createRole(data: any) {
    const role = await prisma.role.create({ data });
    revalidatePath('/settings/roles');
    return role;
}

export async function updateRole(id: string, data: any) {
    const role = await prisma.role.update({
        where: { id },
        data,
    });
    revalidatePath('/settings/roles');
    return role;
}

export async function deleteRole(id: string) {
    await prisma.role.delete({ where: { id } });
    revalidatePath('/settings/roles');
}

// --- Workers ---

export async function getWorkers() {
    return await prisma.worker.findMany({
        include: {
            role: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
}

export async function getPaginatedWorkers(
    page: number = 1,
    limit: number = 50,
    filters: {
        search?: string;
        ministryIds?: string[];
    } = {}
) {
    const where: any = {};
    if (filters.ministryIds && filters.ministryIds.length > 0) {
        where.OR = [
            { majorMinistryId: { in: filters.ministryIds } },
            { minorMinistryId: { in: filters.ministryIds } }
        ];
    }
    if (filters.search) {
        where.AND = [
            {
                OR: [
                    { firstName: { contains: filters.search, mode: 'insensitive' } },
                    { lastName: { contains: filters.search, mode: 'insensitive' } },
                    { email: { contains: filters.search, mode: 'insensitive' } },
                    { workerId: { contains: filters.search, mode: 'insensitive' } },
                ]
            }
        ];
    }

    const [total, workers] = await prisma.$transaction([
        prisma.worker.count({ where }),
        prisma.worker.findMany({
            where,
            include: { role: true },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        })
    ]);

    return { total, workers, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getWorkerStats(ministryIds?: string[]) {
    const where: any = {};
    if (ministryIds && ministryIds.length > 0) {
        where.OR = [
            { majorMinistryId: { in: ministryIds } },
            { minorMinistryId: { in: ministryIds } }
        ];
    }
    
    const [total, active, inactive, secondary] = await prisma.$transaction([
        prisma.worker.count({ where }),
        prisma.worker.count({ where: { ...where, status: 'Active' } }),
        prisma.worker.count({ where: { ...where, status: 'Inactive' } }),
        prisma.worker.count({ where: { ...where, roleId: { contains: 'secondary' } } }) // Example logic for secondary
    ]);
    
    return {
        total,
        active,
        inactive,
        secondary,
        // For ministry breakdown if needed
        ministryStats: ministryIds?.length ? await Promise.all(ministryIds.map(async (id) => {
            const mWhere = {
                OR: [{ majorMinistryId: id }, { minorMinistryId: id }]
            };
            return {
                ministryId: id,
                total: await prisma.worker.count({ where: mWhere }),
                active: await prisma.worker.count({ where: { ...mWhere, status: 'Active' } }),
                inactive: await prisma.worker.count({ where: { ...mWhere, status: 'Inactive' } }),
                secondary: await prisma.worker.count({ where: { ...mWhere, roleId: { contains: 'secondary' } } }),
            };
        })) : []
    };
}

export async function getWorkerById(id: string) {
    return await prisma.worker.findUnique({
        where: { id },
        include: {
            role: true,
        },
    });
}

export async function getWorkerByEmail(email: string) {
    return await prisma.worker.findUnique({
        where: { email },
        include: {
            role: true,
        },
    });
}

export async function createWorker(data: any) {
    const worker = await prisma.worker.create({
        data: {
            ...data,
            createdAt: new Date(),
        },
    });
    revalidatePath('/workers');
    return worker;
}

export async function updateWorker(id: string, data: any) {
    const worker = await prisma.worker.update({
        where: { id },
        data,
    });
    revalidatePath('/workers');
    return worker;
}

export async function deleteWorker(id: string) {
    await prisma.worker.delete({
        where: { id },
    });
    revalidatePath('/workers');
}

export async function deleteWorkers(ids: string[]) {
    await prisma.worker.deleteMany({
        where: { id: { in: ids } },
    });
    revalidatePath('/workers');
}

// --- Approvals ---

export async function createApproval(data: any) {
    const approval = await prisma.approvalRequest.create({
        data: {
            ...data,
            date: new Date(),
        },
    });

    // Trigger async notification
    NotificationService.notifyNewRequest(approval);

    return approval;
}

export async function getApprovals() {
    return await prisma.approvalRequest.findMany({
        orderBy: {
            date: 'desc',
        },
    });
}

export async function updateApproval(id: string, data: any) {
    const approval = await prisma.approvalRequest.update({
        where: { id },
        data,
    });

    const status = data.status;

    // Handle side-effects for Room Bookings
    if (approval.type === 'Room Booking' && approval.reservationId) {
        await prisma.booking.update({
            where: { id: approval.reservationId },
            data: { status },
        }).catch(err => {
            console.error('Failed to update booking status:', err);
        });
    }

    // Handle final approval side-effects for workers
    if (status === 'Approved') {
        if (approval.type === 'New Worker' && approval.workerId) {
            await prisma.worker.update({
                where: { id: approval.workerId },
                data: { status: 'Active' },
            }).catch(err => {
                console.error('Failed to activate worker status:', err);
            });
        }

        if (approval.type === 'Ministry Change' && approval.workerId) {
            await prisma.worker.update({
                where: { id: approval.workerId },
                data: {
                    majorMinistryId: approval.newMajorId || '',
                    minorMinistryId: approval.newMinorId || '',
                },
            }).catch(err => {
                console.error('Failed to update worker ministry:', err);
            });
        }
    }

    revalidatePath('/approvals');
    revalidatePath('/dashboard');
    return approval;
}

// --- Ministries ---

export async function getMinistries() {
    return await prisma.ministry.findMany({
        orderBy: {
            weight: 'asc',
        },
    });
}

export async function createMinistry(data: any) {
    const ministry = await prisma.ministry.create({ data });
    revalidatePath('/settings/ministries');
    return ministry;
}

export async function updateMinistry(id: string, data: any) {
    const ministry = await prisma.ministry.update({
        where: { id },
        data,
    });
    revalidatePath('/settings/ministries');
    return ministry;
}

export async function createMinistries(data: any[]) {
    const result = await prisma.ministry.createMany({
        data,
        skipDuplicates: true,
    });
    revalidatePath('/settings/ministries');
    return result;
}

export async function deleteMinistry(id: string) {
    await prisma.ministry.delete({ where: { id } });
    revalidatePath('/settings/ministries');
}

// --- Bookings ---

export async function getBookings(filters: { workerProfileId?: string; dateFrom?: Date } = {}) {
    const where: any = {};
    if (filters.workerProfileId) {
        where.workerProfileId = filters.workerProfileId;
    }
    if (filters.dateFrom) {
        where.start = {
            gte: filters.dateFrom,
        };
    }

    return await prisma.booking.findMany({
        where,
        include: {
            room: true,
            worker: true,
        },
        orderBy: {
            start: 'asc',
        },
    });
}

export async function createBooking(data: any) {
    const booking = await prisma.booking.create({ data });
    revalidatePath('/reservations');
    revalidatePath('/dashboard');
    return booking;
}

export async function updateBooking(id: string, data: any) {
    const booking = await prisma.booking.update({
        where: { id },
        data,
    });
    revalidatePath('/reservations');
    revalidatePath('/dashboard');
    return booking;
}

export async function deleteBooking(id: string) {
    await prisma.booking.delete({ where: { id } });
    revalidatePath('/reservations');
    revalidatePath('/dashboard');
}

// --- Meal Stubs ---

export async function getMealStubs(filters: { workerId?: string; dateFrom?: Date } = {}) {
    const where: any = {};
    if (filters.workerId) where.workerId = filters.workerId;
    if (filters.dateFrom) where.date = { gte: filters.dateFrom };

    return await prisma.mealStub.findMany({
        where,
        orderBy: {
            date: 'desc',
        },
    });
}

export async function createMealStub(data: {
    workerId: string;
    workerName: string;
    status: string;
    stubType?: string;
    assignedBy?: string;
    assignedByName?: string;
    date?: Date; // Optional: allow passing a custom date (e.g. for Sunday mode)
}) {
    return await prisma.mealStub.create({
        data: {
            ...data,
            date: data.date || new Date(),
        },
    });
}

export async function updateMealStub(id: string, data: any) {
    const stub = await prisma.mealStub.update({
        where: { id },
        data,
    });
    revalidatePath('/meals');
    return stub;
}

export async function deleteMealStub(id: string) {
    await prisma.mealStub.delete({ where: { id } });
    revalidatePath('/meals');
}

// --- Attendance ---

export async function getAttendanceRecords(filters: { workerProfileId?: string; dateFrom?: Date } = {}) {
    const where: any = {};
    if (filters.workerProfileId) where.workerProfileId = filters.workerProfileId;
    if (filters.dateFrom) where.time = { gte: filters.dateFrom };

    return await prisma.attendanceRecord.findMany({
        where,
        include: {
            worker: true,
        },
        orderBy: {
            time: 'desc',
        },
    });
}

export async function createAttendanceRecord(data: { workerProfileId: string; type: string }) {
    const record = await prisma.attendanceRecord.create({
        data: {
            ...data,
            time: new Date(),
        },
    });
    revalidatePath('/attendance');
    return record;
}

// --- Rooms, Areas, Branches ---

export async function getRooms() {
    return await prisma.room.findMany({
        include: {
            area: {
                include: {
                    branch: true,
                },
            },
        },
        orderBy: {
            weight: 'asc',
        },
    });
}

export async function createRoom(data: any) {
    const room = await prisma.room.create({ data });
    revalidatePath('/settings/rooms');
    return room;
}

export async function updateRoom(id: string, data: any) {
    const room = await prisma.room.update({
        where: { id },
        data,
    });
    revalidatePath('/settings/rooms');
    return room;
}

export async function deleteRoom(id: string) {
    await prisma.room.delete({ where: { id } });
    revalidatePath('/settings/rooms');
}

export async function createRooms(data: any[]) {
    await prisma.room.createMany({ data });
    revalidatePath('/settings/rooms');
}

export async function getAreas() {
    return await prisma.area.findMany({
        include: {
            branch: true,
        },
        orderBy: {
            name: 'asc',
        },
    });
}

export async function createArea(data: any) {
    const area = await prisma.area.create({ data });
    revalidatePath('/settings/rooms');
    return area;
}

export async function updateArea(id: string, data: any) {
    const area = await prisma.area.update({
        where: { id },
        data,
    });
    revalidatePath('/settings/rooms');
    return area;
}

export async function deleteArea(id: string) {
    await prisma.area.delete({ where: { id } });
    revalidatePath('/settings/rooms');
}

export async function createAreas(data: any[]) {
    await prisma.area.createMany({ data });
    revalidatePath('/settings/rooms');
}

export async function getBranches() {
    return await prisma.branch.findMany({
        orderBy: {
            name: 'asc',
        },
    });
}

export async function createBranch(data: any) {
    const branch = await prisma.branch.create({ data });
    revalidatePath('/settings/rooms');
    return branch;
}

export async function updateBranch(id: string, data: any) {
    const branch = await prisma.branch.update({
        where: { id },
        data,
    });
    revalidatePath('/settings/rooms');
    return branch;
}

export async function deleteBranch(id: string) {
    await prisma.branch.delete({ where: { id } });
    revalidatePath('/settings/rooms');
}

// --- Scan Logs ---

export async function getScanLogs(limit: number = 100) {
    return await prisma.scanLog.findMany({
        take: limit,
        orderBy: {
            timestamp: 'desc',
        },
    });
}

export async function createScanLog(data: any) {
    return await prisma.scanLog.create({
        data: {
            ...data,
            timestamp: new Date(),
        },
    });
}

// --- C2S ---

export async function getC2SGroups() {
    return await prisma.c2SGroup.findMany({
        include: {
            mentees: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
}

export async function getC2SMentees() {
    return await prisma.c2SMentee.findMany({
        include: {
            group: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
}

// --- Venue Elements ---

export async function getVenueElements() {
    return await prisma.venueElement.findMany({
        orderBy: {
            name: 'asc',
        },
    });
}

export async function createVenueElement(data: any) {
    const element = await prisma.venueElement.create({ data });
    revalidatePath('/settings/venue-elements');
    revalidatePath('/settings/rooms');
    return element;
}

export async function updateVenueElement(id: string, data: any) {
    const element = await prisma.venueElement.update({
        where: { id },
        data,
    });
    revalidatePath('/settings/venue-elements');
    revalidatePath('/settings/rooms');
    return element;
}

export async function deleteVenueElement(id: string) {
    await prisma.venueElement.delete({ where: { id } });
    revalidatePath('/settings/venue-elements');
    revalidatePath('/settings/rooms');
}

// --- Batch Ministry Update ---

export async function updateWorkersMinistries(
    ids: string[],
    majorMinistryId?: string,
    minorMinistryId?: string,
) {
    const data: any = {};
    if (majorMinistryId !== undefined) data.majorMinistryId = majorMinistryId;
    if (minorMinistryId !== undefined) data.minorMinistryId = minorMinistryId;

    await prisma.worker.updateMany({
        where: { id: { in: ids } },
        data,
    });
    revalidatePath('/workers');
}

// --- Settings ---

export async function getSetting(id: string) {
    const setting = await prisma.setting.findUnique({
        where: { id },
    });
    return (setting?.data as any) || null;
}

export async function updateSetting(id: string, data: any) {
    const setting = await prisma.setting.upsert({
        where: { id },
        update: { data },
        create: { id, data },
    });
    revalidatePath('/settings');
    return setting.data;
}

// --- Department Settings ---

export async function getDepartmentSettings() {
    return await prisma.departmentSetting.findMany({
        orderBy: {
            id: 'asc',
        },
    });
}

export async function getDepartmentSetting(id: string) {
    return await prisma.departmentSetting.findUnique({
        where: { id },
    });
}

export async function createDepartmentSetting(data: any) {
    return await prisma.departmentSetting.create({
        data,
    });
}

export async function updateDepartmentSetting(id: string, data: any) {
    return await prisma.departmentSetting.update({
        where: { id },
        data,
    });
}

export async function upsertDepartmentSetting(id: string, data: any) {
    return await prisma.departmentSetting.upsert({
        where: { id },
        update: data,
        create: { id, ...data },
    });
}

export async function deleteDepartmentSetting(id: string) {
    return await prisma.departmentSetting.delete({
        where: { id },
    });
}

// --- Transaction Logs ---

export async function createTransactionLog(data: any) {
    return await prisma.transactionLog.create({
        data,
    });
}

export async function getWorkerLogs(workerId: string) {
    return await prisma.transactionLog.findMany({
        where: {
            OR: [
                { targetId: workerId },
                { userId: workerId }
            ]
        },
        orderBy: {
            timestamp: 'desc',
        },
        take: 50,
    });
}
