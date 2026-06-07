import { prisma } from '@studio/database/prisma';
import type {
    CreateEventInput,
    UpdateEventInput,
    AddEventRoomInput,
    UpdateEventRoomInput,
    UpsertEventAssignmentInput,
    AddEventEquipmentInput,
    UpdateEventEquipmentInput,
} from '@/lib/schemas/events.schemas';

// ─── Events ──────────────────────────────────────────────────────────────────

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

export async function createEvent(data: CreateEventInput) {
    return prisma.churchEvent.create({ data });
}

export async function updateEvent(id: string, data: UpdateEventInput) {
    return prisma.churchEvent.update({ where: { id }, data });
}

export async function deleteEvent(id: string) {
    await prisma.churchEvent.delete({ where: { id } });
}

// ─── Room bookings ───────────────────────────────────────────────────────────

export async function addEventRoom(data: AddEventRoomInput) {
    return prisma.eventRoomBooking.create({
        data,
        include: { room: { include: { area: { include: { branch: true } } } } },
    });
}

export async function updateEventRoom(id: string, data: UpdateEventRoomInput) {
    return prisma.eventRoomBooking.update({ where: { id }, data });
}

export async function removeEventRoom(id: string) {
    await prisma.eventRoomBooking.delete({ where: { id } });
}

// ─── Manpower assignments ────────────────────────────────────────────────────

export async function upsertEventAssignment(data: UpsertEventAssignmentInput) {
    const { id, ...rest } = data;
    return id
        ? prisma.eventAssignment.update({ where: { id }, data: rest })
        : prisma.eventAssignment.create({ data: rest });
}

export async function deleteEventAssignment(id: string) {
    await prisma.eventAssignment.delete({ where: { id } });
}

// ─── Equipment ───────────────────────────────────────────────────────────────

export async function addEventEquipment(data: AddEventEquipmentInput) {
    return prisma.eventEquipment.create({
        data,
        include: { item: { include: { category: true } } },
    });
}

export async function updateEventEquipment(id: string, data: UpdateEventEquipmentInput) {
    return prisma.eventEquipment.update({ where: { id }, data });
}

export async function removeEventEquipment(id: string) {
    await prisma.eventEquipment.delete({ where: { id } });
}

// ─── Inventory lookup for equipment picker ──────────────────────────────────

export async function getInventoryItemsForPicker() {
    return prisma.inventoryItem.findMany({
        select: { id: true, name: true, unit: true, quantity: true, category: { select: { name: true } } },
        orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
        take: 500,
    });
}
