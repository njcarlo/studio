'use server';

import { prisma } from '@studio/database/prisma';
import { revalidatePath } from 'next/cache';

export async function getEvents(filters: { status?: string } = {}) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    return prisma.churchEvent.findMany({
        where,
        include: {
            rooms: { include: { room: { include: { area: { include: { branch: true } } } } } },
            assignments: true,
            equipment: { include: { item: true } },
        },
        orderBy: { date: 'desc' },
    });
}

export async function getEvent(id: string) {
    return prisma.churchEvent.findUnique({
        where: { id },
        include: {
            rooms: { include: { room: { include: { area: { include: { branch: true } } } } } },
            assignments: { orderBy: [{ ministryId: 'asc' }, { order: 'asc' }] },
            equipment: { include: { item: { include: { category: true } } } },
        },
    });
}

export async function createEvent(data: {
    title: string;
    description?: string;
    date: Date;
    endDate?: Date;
    startTime?: string;
    endTime?: string;
    location?: string;
    notes?: string;
    createdBy: string;
}) {
    const event = await prisma.churchEvent.create({ data });
    revalidatePath('/events');
    return event;
}

export async function updateEvent(id: string, data: Partial<{
    title: string;
    description: string;
    date: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
    location: string;
    status: string;
    notes: string;
    scheduleId: string;
}>) {
    const event = await prisma.churchEvent.update({ where: { id }, data });
    revalidatePath('/events');
    revalidatePath(`/events/${id}`);
    return event;
}

export async function deleteEvent(id: string) {
    await prisma.churchEvent.delete({ where: { id } });
    revalidatePath('/events');
}

// ── Room Bookings ─────────────────────────────────────────────────────────────

export async function addEventRoom(data: {
    eventId: string;
    roomId: string;
    startTime: string;
    endTime: string;
    purpose?: string;
    notes?: string;
}) {
    const booking = await prisma.eventRoomBooking.create({
        data,
        include: { room: { include: { area: { include: { branch: true } } } } },
    });
    revalidatePath(`/events/${data.eventId}`);
    return booking;
}

export async function updateEventRoom(id: string, eventId: string, data: Partial<{
    startTime: string;
    endTime: string;
    purpose: string;
    notes: string;
}>) {
    const booking = await prisma.eventRoomBooking.update({ where: { id }, data });
    revalidatePath(`/events/${eventId}`);
    return booking;
}

export async function removeEventRoom(id: string, eventId: string) {
    await prisma.eventRoomBooking.delete({ where: { id } });
    revalidatePath(`/events/${eventId}`);
}

// ── Manpower Assignments ──────────────────────────────────────────────────────

export async function upsertEventAssignment(data: {
    id?: string;
    eventId: string;
    ministryId: string;
    roleName: string;
    workerId?: string | null;
    workerName?: string | null;
    notes?: string;
    order?: number;
}) {
    const { id, ...rest } = data;
    const assignment = id
        ? await prisma.eventAssignment.update({ where: { id }, data: rest })
        : await prisma.eventAssignment.create({ data: rest });
    revalidatePath(`/events/${data.eventId}`);
    return assignment;
}

export async function deleteEventAssignment(id: string, eventId: string) {
    await prisma.eventAssignment.delete({ where: { id } });
    revalidatePath(`/events/${eventId}`);
}

// ── Equipment ─────────────────────────────────────────────────────────────────

export async function addEventEquipment(data: {
    eventId: string;
    itemId: string;
    quantity: number;
    notes?: string;
}) {
    const eq = await prisma.eventEquipment.create({
        data,
        include: { item: { include: { category: true } } },
    });
    revalidatePath(`/events/${data.eventId}`);
    return eq;
}

export async function updateEventEquipment(id: string, eventId: string, data: Partial<{
    quantity: number;
    notes: string;
}>) {
    const eq = await prisma.eventEquipment.update({ where: { id }, data });
    revalidatePath(`/events/${eventId}`);
    return eq;
}

export async function removeEventEquipment(id: string, eventId: string) {
    await prisma.eventEquipment.delete({ where: { id } });
    revalidatePath(`/events/${eventId}`);
}

// ── Inventory lookup for equipment picker ────────────────────────────────────
export async function getInventoryItemsForPicker() {
    return prisma.inventoryItem.findMany({
        select: { id: true, name: true, unit: true, quantity: true, category: { select: { name: true } } },
        where: { isActive: undefined }, // fetch all
        orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
        take: 500,
    });
}
