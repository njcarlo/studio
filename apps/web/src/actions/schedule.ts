"use server";

import { revalidatePath } from 'next/cache';
import { withPermission } from '@/lib/auth/with-permission';
import { PERMISSIONS } from '@/lib/permissions/registry';
import * as scheduleService from '@/services/schedule';
import {
    createServiceScheduleSchema,
    updateServiceScheduleSchema,
    createServiceTemplateSchema,
    updateServiceTemplateSchema,
    createWorshipSlotSchema,
    updateWorshipSlotSchema,
} from '@/lib/schemas/schedule.schemas';

// ── Service Schedules ─────────────────────────────────────────────────────────

// public-action: read-only
export async function getServiceSchedules() {
    return scheduleService.getServiceSchedules();
}

// public-action: read-only
export async function getServiceSchedule(id: string) {
    return scheduleService.getServiceSchedule(id);
}

export const createServiceSchedule = withPermission(
    PERMISSIONS.schedule.manage,
    async (_ctx, data: {
        date: Date;
        title?: string;
        notes?: string;
        createdBy: string;
    }) => {
        const parsed = createServiceScheduleSchema.parse(data);
        const schedule = await scheduleService.createServiceSchedule(parsed);
        revalidatePath('/schedule');
        return schedule;
    },
);

export const updateServiceSchedule = withPermission(
    PERMISSIONS.schedule.manage,
    async (_ctx, id: string, data: {
        title?: string;
        notes?: string;
        status?: string;
    }) => {
        const parsed = updateServiceScheduleSchema.parse(data);
        const schedule = await scheduleService.updateServiceSchedule(id, parsed);
        revalidatePath('/schedule');
        revalidatePath(`/schedule/${id}`);
        return schedule;
    },
);

export const deleteServiceSchedule = withPermission(
    PERMISSIONS.schedule.manage,
    async (_ctx, id: string) => {
        await scheduleService.deleteServiceSchedule(id);
        revalidatePath('/schedule');
    },
);

// ── Schedule Assignments ──────────────────────────────────────────────────────

export const upsertAssignment = withPermission(
    PERMISSIONS.schedule.manage,
    async (_ctx, data: {
        id?: string;
        scheduleId: string;
        ministryId: string;
        roleName: string;
        workerId?: string | null;
        workerName?: string | null;
        notes?: string | null;
        rehearsalDate?: Date | null;
        rehearsalTime?: string | null;
        order?: number;
    }) => {
        return scheduleService.upsertAssignment(data);
    },
);

export const deleteAssignment = withPermission(
    PERMISSIONS.schedule.manage,
    async (_ctx, id: string) => {
        await scheduleService.deleteAssignment(id);
    },
);

export const applyTemplateToSchedule = withPermission(
    PERMISSIONS.schedule.manage,
    async (_ctx, scheduleId: string, templateId: string) => {
        await scheduleService.applyTemplateToSchedule(scheduleId, templateId);
        revalidatePath(`/schedule/${scheduleId}`);
    },
);

// ── Service Templates ─────────────────────────────────────────────────────────

// public-action: read-only
export async function getServiceTemplates(ministryId?: string) {
    return scheduleService.getServiceTemplates(ministryId);
}

export const createServiceTemplate = withPermission(
    PERMISSIONS.schedule.manage,
    async (_ctx, data: {
        ministryId: string;
        name: string;
        isDefault?: boolean;
        createdBy: string;
        roles: { roleName: string; count: number; notes?: string; order?: number }[];
    }) => {
        const parsed = createServiceTemplateSchema.parse(data);
        const template = await scheduleService.createServiceTemplate(parsed);
        revalidatePath('/schedule/templates');
        return template;
    },
);

export const updateServiceTemplate = withPermission(
    PERMISSIONS.schedule.manage,
    async (_ctx, id: string, data: {
        name?: string;
        isDefault?: boolean;
        roles?: { roleName: string; count: number; notes?: string; order?: number }[];
    }) => {
        const parsed = updateServiceTemplateSchema.parse(data);
        const template = await scheduleService.updateServiceTemplate(id, parsed);
        revalidatePath('/schedule/templates');
        return template;
    },
);

export const deleteServiceTemplate = withPermission(
    PERMISSIONS.schedule.manage,
    async (_ctx, id: string) => {
        await scheduleService.deleteServiceTemplate(id);
        revalidatePath('/schedule/templates');
    },
);

// ── Publish & Notify ──────────────────────────────────────────────────────────

export const publishScheduleAndNotify = withPermission(
    PERMISSIONS.schedule.manage,
    async (_ctx, scheduleId: string, publishedBy: string) => {
        const result = await scheduleService.publishScheduleAndNotify(scheduleId, publishedBy);
        revalidatePath(`/schedule/${scheduleId}`);
        revalidatePath('/schedule');
        return result;
    },
);

// ── Confirm Assignment ────────────────────────────────────────────────────────

// public-action: workers confirm their own assignment (no admin perm needed)
export async function confirmAssignment(assignmentId: string, confirmedBy: string) {
    const assignment = await scheduleService.confirmAssignment(assignmentId, confirmedBy);
    revalidatePath(`/schedule/${assignment.scheduleId}`);
    return assignment;
}

// public-action: workers update their own attendance status
export async function setAttendanceStatus(assignmentId: string, status: 'Confirmed' | 'Pending' | 'Not Attending', updatedBy: string) {
    const assignment = await scheduleService.setAttendanceStatus(assignmentId, status, updatedBy);
    revalidatePath(`/schedule/${assignment.scheduleId}`);
    return assignment;
}

export async function getScheduleConfirmationStatus(scheduleId: string) {
    return scheduleService.getScheduleConfirmationStatus(scheduleId);
}

// ── Eligible Worker Search ────────────────────────────────────────────────────

export async function getEligibleWorkers(params: {
    ministryId: string;
    query?: string;
    limit?: number;
}) {
    return scheduleService.getEligibleWorkers(params);
}

// ── Worker ID lookup for assignment ──────────────────────────────────────────

export async function findWorkerByWorkerId(workerId: string) {
    return scheduleService.findWorkerByWorkerId(workerId);
}

// ── Conflict Detection ────────────────────────────────────────────────────────

export async function getWorkerConflicts(scheduleId: string) {
    return scheduleService.getWorkerConflicts(scheduleId);
}

// ── Public Schedule ───────────────────────────────────────────────────────────

export const togglePublicSchedule = withPermission(
    PERMISSIONS.schedule.manage,
    async (_ctx, id: string, isPublic: boolean) => {
        const schedule = await scheduleService.togglePublicSchedule(id, isPublic);
        revalidatePath(`/schedule/${id}`);
        return schedule;
    },
);

// public-action: token-based public view (no auth required)
export async function getPublicSchedule(token: string) {
    return scheduleService.getPublicSchedule(token);
}

// public-action: read-only public listing
export async function getPublicSchedules() {
    return scheduleService.getPublicSchedules();
}

// ── History ───────────────────────────────────────────────────────────────────

// public-action: read-only, used by schedule history view
export async function getScheduleHistory() {
    return scheduleService.getScheduleHistory();
}

// ── Worship Slots ─────────────────────────────────────────────────────────────

// public-action: read-only
export async function getWorshipSlots(scheduleId: string) {
    return scheduleService.getWorshipSlots(scheduleId);
}

export const createWorshipSlot = withPermission(
    PERMISSIONS.schedule.manage,
    async (_ctx, data: {
        scheduleId: string;
        ministryId?: string | null;
        slotName: string;
        notes?: string;
        order?: number;
    }) => {
        const parsed = createWorshipSlotSchema.parse(data);
        const slot = await scheduleService.createWorshipSlot(parsed);
        revalidatePath(`/schedule/${parsed.scheduleId}`);
        return slot;
    },
);

export const updateWorshipSlot = withPermission(
    PERMISSIONS.schedule.manage,
    async (_ctx, id: string, data: { slotName?: string; notes?: string; order?: number }) => {
        const parsed = updateWorshipSlotSchema.parse(data);
        const slot = await scheduleService.updateWorshipSlot(id, parsed);
        revalidatePath(`/schedule/${slot.scheduleId}`);
        return slot;
    },
);

export const deleteWorshipSlot = withPermission(
    PERMISSIONS.schedule.manage,
    async (_ctx, id: string) => {
        const slot = await scheduleService.deleteWorshipSlot(id);
        revalidatePath(`/schedule/${slot.scheduleId}`);
    },
);

export const addWorkerToWorshipSlot = withPermission(
    PERMISSIONS.schedule.manage,
    async (_ctx, slotId: string, workerId: string, workerName: string, role?: string) => {
        const { entry, slot } = await scheduleService.addWorkerToWorshipSlot(slotId, workerId, workerName, role);
        if (slot) revalidatePath(`/schedule/${slot.scheduleId}`);
        return entry;
    },
);

export const removeWorkerFromWorshipSlot = withPermission(
    PERMISSIONS.schedule.manage,
    async (_ctx, id: string) => {
        const { slot } = await scheduleService.removeWorkerFromWorshipSlot(id);
        if (slot) revalidatePath(`/schedule/${slot.scheduleId}`);
    },
);

// ── Scheduler Assignment ──────────────────────────────────────────────────────

export const addMinistryScheduler = withPermission(
    PERMISSIONS.schedule.assign_schedulers,
    async (_ctx, ministryId: string, workerId: string) => {
        await scheduleService.addMinistryScheduler(ministryId, workerId);
        revalidatePath('/schedule');
    },
);

export const removeMinistryScheduler = withPermission(
    PERMISSIONS.schedule.assign_schedulers,
    async (_ctx, ministryId: string, workerId: string) => {
        await scheduleService.removeMinistryScheduler(ministryId, workerId);
        revalidatePath('/schedule');
    },
);

// public-action: read-only, used by ministry scheduler picker
export async function getMinistrySchedulers() {
    return scheduleService.getMinistrySchedulers();
}

// ── Monthly Duty Caps ─────────────────────────────────────────────────────────

export async function getMonthlyDutyCounts(scheduleId: string) {
    return scheduleService.getMonthlyDutyCounts(scheduleId);
}

// ── Mealstub Allocation Action ───────────────────────────────────────────────

export async function allocateMealstubs(scheduleId: string, publishedBy: string = 'system') {
    return scheduleService.allocateMealstubs(scheduleId, publishedBy);
}
