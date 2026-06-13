"use server";

import { prisma } from '@studio/database/prisma';
import { revalidatePath } from 'next/cache';
import { withPermission, withPublicAction, resolveCallerCtx } from '@/lib/auth/with-permission';
import { PERMISSIONS } from '@/lib/permissions/registry';
import * as MajorEventWorkflow from '@/services/major-event-workflow';

// --- Service catalogue (Sys Admin managed, grouped by providing ministry) ---

export async function getMajorEventCatalog() {
    return prisma.majorEventServiceCatalogItem.findMany({
        orderBy: [{ ministryId: 'asc' }, { sortOrder: 'asc' }],
    });
}

export const createMajorEventCatalogItem = withPermission(
    PERMISSIONS.major_events.manage_catalog,
    async (_ctx, data: { ministryId: string; name: string; description?: string }) => {
        const name = data.name?.trim();
        if (!name) throw new Error('INVALID_NAME');

        const maxOrderRes = await prisma.majorEventServiceCatalogItem.aggregate({
            where: { ministryId: data.ministryId },
            _max: { sortOrder: true },
        });
        const sortOrder = (maxOrderRes._max.sortOrder ?? -1) + 1;

        const item = await prisma.majorEventServiceCatalogItem.create({
            data: { ministryId: data.ministryId, name, description: data.description, sortOrder },
        });
        revalidatePath('/settings/major-events');
        return item;
    },
);

export const updateMajorEventCatalogItem = withPermission(
    PERMISSIONS.major_events.manage_catalog,
    async (_ctx, id: string, data: { name?: string; description?: string; active?: boolean }) => {
        const name = data.name !== undefined ? data.name.trim() : undefined;
        if (data.name !== undefined && !name) throw new Error('INVALID_NAME');

        const item = await prisma.majorEventServiceCatalogItem.update({
            where: { id },
            data: { ...data, name },
        });
        revalidatePath('/settings/major-events');
        return item;
    },
);

export const deleteMajorEventCatalogItem = withPermission(
    PERMISSIONS.major_events.manage_catalog,
    async (_ctx, id: string) => {
        await prisma.majorEventServiceCatalogItem.delete({ where: { id } }).catch(() => null);
        revalidatePath('/settings/major-events');
    },
);

// --- Major Event button enable/disable toggle (Sys Admin) ---

export const getMajorEventSetting = withPublicAction(async () => {
    return prisma.majorEventSetting.upsert({
        where: { id: 'global' },
        update: {},
        create: { id: 'global', enabled: true },
    });
});

export const updateMajorEventSetting = withPermission(
    PERMISSIONS.major_events.manage_catalog,
    async (ctx, enabled: boolean) => {
        const setting = await prisma.majorEventSetting.upsert({
            where: { id: 'global' },
            update: { enabled, updatedBy: ctx.workerId },
            create: { id: 'global', enabled, updatedBy: ctx.workerId },
        });
        revalidatePath('/settings/major-events');
        return setting;
    },
);

// --- Major Event requests ---

export const createMajorEventRequest = withPublicAction(
    async (input: Omit<MajorEventWorkflow.CreateMajorEventRequestInput, 'requesterId'>) => {
        const ctx = await resolveCallerCtx();
        if (!ctx) throw new Error('You must be logged in to do this.');

        const setting = await prisma.majorEventSetting.findUnique({ where: { id: 'global' } });
        if (setting && !setting.enabled) {
            throw new Error('Major Event requests are currently disabled.');
        }

        const { request } = await MajorEventWorkflow.createMajorEventRequest({
            ...input,
            requesterId: ctx.workerId,
        });

        revalidatePath('/major-events');
        revalidatePath('/approvals');
        return request;
    },
);

export const getMyMajorEventRequests = withPublicAction(async () => {
    const ctx = await resolveCallerCtx();
    if (!ctx) throw new Error('You must be logged in to do this.');

    return prisma.majorEventRequest.findMany({
        where: { requesterId: ctx.workerId },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
    });
});
