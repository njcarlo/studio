'use server';

import { revalidatePath } from 'next/cache';
import { withPermission, withPublicAction } from '@/lib/auth/with-permission';
import { PERMISSIONS } from '@/lib/permissions/registry';
import * as eventsService from '@/services/events';
import {
    createEventSchema,
    updateEventSchema,
    addEventRoomSchema,
    updateEventRoomSchema,
    upsertEventAssignmentSchema,
    addEventEquipmentSchema,
    updateEventEquipmentSchema,
} from '@/lib/schemas/events.schemas';

// public-action: read-only
export async function getEvents(filters: { status?: string } = {}) {
    return eventsService.getEvents(filters);
}

// public-action: read-only
export async function getEvent(id: string) {
    return eventsService.getEvent(id);
}

export const createEvent = withPermission(
    PERMISSIONS.events.create,
    async (_ctx, data: {
        title: string;
        description?: string;
        date: Date;
        endDate?: Date;
        startTime?: string;
        endTime?: string;
        location?: string;
        notes?: string;
        videoUrl?: string;
        createdBy: string;
    }) => {
        const event = await eventsService.createEvent(createEventSchema.parse(data));
        revalidatePath('/events');
        return event;
    },
);

export const updateEvent = withPermission(
    PERMISSIONS.events.update,
    async (_ctx, id: string, data: Partial<{
        title: string;
        description: string;
        date: Date;
        endDate: Date;
        startTime: string;
        endTime: string;
        location: string;
        status: string;
        notes: string;
        videoUrl: string | null;
        scheduleId: string;
        isPublic: boolean;
    }>) => {
        const event = await eventsService.updateEvent(id, updateEventSchema.parse(data));
        revalidatePath('/events');
        revalidatePath(`/events/${id}`);
        return event;
    },
);

export const deleteEvent = withPermission(
    PERMISSIONS.events.delete,
    async (_ctx, id: string) => {
        await eventsService.deleteEvent(id);
        revalidatePath('/events');
    },
);

// ── Attendee-facing public module (5.13) ──────────────────────────────────────

export const setEventPublicVisibility = withPermission(
    PERMISSIONS.events.update,
    async (_ctx, id: string, isPublic: boolean) => {
        const event = await eventsService.setEventPublicVisibility(id, isPublic);
        revalidatePath(`/events/${id}`);
        revalidatePath('/public/events');
        return event;
    },
);

export const getEventSignupsAction = withPermission(
    PERMISSIONS.events.update,
    async (_ctx, eventId: string) => {
        return eventsService.getEventSignups(eventId);
    },
);

// public-action: read-only
export const getPublicEvents = withPublicAction(async () => {
    return eventsService.listPublicEvents();
});

export const submitEventSignup = withPublicAction(
    async (eventId: string, input: eventsService.EventSignupInput) => {
        return eventsService.createEventSignup(eventId, input);
    },
);

// ── Room Bookings ─────────────────────────────────────────────────────────────

export const addEventRoom = withPermission(
    PERMISSIONS.events.update,
    async (_ctx, data: {
        eventId: string;
        roomId: string;
        startTime: string;
        endTime: string;
        purpose?: string;
        notes?: string;
    }) => {
        const parsed = addEventRoomSchema.parse(data);
        const booking = await eventsService.addEventRoom(parsed);
        revalidatePath(`/events/${parsed.eventId}`);
        return booking;
    },
);

export const updateEventRoom = withPermission(
    PERMISSIONS.events.update,
    async (_ctx, id: string, eventId: string, data: Partial<{
        startTime: string;
        endTime: string;
        purpose: string;
        notes: string;
    }>) => {
        const booking = await eventsService.updateEventRoom(id, updateEventRoomSchema.parse(data));
        revalidatePath(`/events/${eventId}`);
        return booking;
    },
);

export const removeEventRoom = withPermission(
    PERMISSIONS.events.update,
    async (_ctx, id: string, eventId: string) => {
        await eventsService.removeEventRoom(id);
        revalidatePath(`/events/${eventId}`);
    },
);

// ── Manpower Assignments ──────────────────────────────────────────────────────

export const upsertEventAssignment = withPermission(
    PERMISSIONS.events.update,
    async (_ctx, data: {
        id?: string;
        eventId: string;
        ministryId: string;
        roleName: string;
        workerId?: string | null;
        workerName?: string | null;
        notes?: string;
        order?: number;
    }) => {
        const parsed = upsertEventAssignmentSchema.parse(data);
        const assignment = await eventsService.upsertEventAssignment(parsed);
        revalidatePath(`/events/${parsed.eventId}`);
        return assignment;
    },
);

export const deleteEventAssignment = withPermission(
    PERMISSIONS.events.update,
    async (_ctx, id: string, eventId: string) => {
        await eventsService.deleteEventAssignment(id);
        revalidatePath(`/events/${eventId}`);
    },
);

// ── Equipment ─────────────────────────────────────────────────────────────────

export const addEventEquipment = withPermission(
    PERMISSIONS.events.update,
    async (_ctx, data: {
        eventId: string;
        itemId: string;
        quantity: number;
        notes?: string;
    }) => {
        const parsed = addEventEquipmentSchema.parse(data);
        const eq = await eventsService.addEventEquipment(parsed);
        revalidatePath(`/events/${parsed.eventId}`);
        return eq;
    },
);

export const updateEventEquipment = withPermission(
    PERMISSIONS.events.update,
    async (_ctx, id: string, eventId: string, data: Partial<{
        quantity: number;
        notes: string;
    }>) => {
        const eq = await eventsService.updateEventEquipment(id, updateEventEquipmentSchema.parse(data));
        revalidatePath(`/events/${eventId}`);
        return eq;
    },
);

export const removeEventEquipment = withPermission(
    PERMISSIONS.events.update,
    async (_ctx, id: string, eventId: string) => {
        await eventsService.removeEventEquipment(id);
        revalidatePath(`/events/${eventId}`);
    },
);

// ── Inventory lookup for equipment picker ────────────────────────────────────
// public-action: read-only picker helper
export async function getInventoryItemsForPicker() {
    return eventsService.getInventoryItemsForPicker();
}
