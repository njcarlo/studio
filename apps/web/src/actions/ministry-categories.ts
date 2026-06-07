"use server";

import { prisma } from '@studio/database/prisma';
import { revalidatePath } from 'next/cache';
import { withPermission } from '@/lib/auth/with-permission';
import { PERMISSIONS } from '@/lib/permissions/registry';

// public-action: read-only
export async function getWorkloadCategories(ministryId: string) {
    return prisma.workloadCategory.findMany({
        where: { ministryId },
        orderBy: { sortOrder: 'asc' }
    });
}

export const createWorkloadCategory = withPermission(
    PERMISSIONS.ministry.manage,
    async (_ctx, data: { ministryId: string; name: string; description?: string }) => {
        const name = data.name?.trim();
        if (!name) throw new Error('INVALID_NAME');
        if (data.description && data.description.length > 255) throw new Error('DESCRIPTION_TOO_LONG');

        const existing = await prisma.workloadCategory.findFirst({
            where: {
                ministryId: data.ministryId,
                name: { equals: name, mode: 'insensitive' }
            }
        });
        if (existing) throw new Error('DUPLICATE_NAME');

        const maxOrderRes = await prisma.workloadCategory.aggregate({
            where: { ministryId: data.ministryId },
            _max: { sortOrder: true }
        });
        const nextOrder = (maxOrderRes._max.sortOrder ?? -1) + 1;

        const category = await prisma.workloadCategory.create({
            data: {
                ministryId: data.ministryId,
                name,
                description: data.description,
                sortOrder: nextOrder
            }
        });
        revalidatePath('/ministries');
        return category;
    },
);

export const updateWorkloadCategory = withPermission(
    PERMISSIONS.ministry.manage,
    async (_ctx, id: string, data: { name?: string; description?: string }) => {
        const existingCat = await prisma.workloadCategory.findUnique({ where: { id } });
        if (!existingCat) throw new Error('Category not found');

        let name = data.name !== undefined ? data.name.trim() : existingCat.name;
        if (data.name !== undefined && !name) throw new Error('INVALID_NAME');
        if (data.description && data.description.length > 255) throw new Error('DESCRIPTION_TOO_LONG');

        if (name !== existingCat.name) {
            const duplicate = await prisma.workloadCategory.findFirst({
                where: {
                    ministryId: existingCat.ministryId,
                    name: { equals: name, mode: 'insensitive' },
                    id: { not: id }
                }
            });
            if (duplicate) throw new Error('DUPLICATE_NAME');
        }

        const category = await prisma.workloadCategory.update({
            where: { id },
            data: {
                name,
                description: data.description !== undefined ? data.description : existingCat.description
            }
        });
        revalidatePath('/ministries');
        return category;
    },
);

export const deleteWorkloadCategory = withPermission(
    PERMISSIONS.ministry.manage,
    async (_ctx, id: string) => {
        const existingCat = await prisma.workloadCategory.findUnique({ where: { id } });
        if (!existingCat) return; // Already deleted
        await prisma.workloadCategory.delete({ where: { id } });
        revalidatePath('/ministries');
    },
);

export const reorderWorkloadCategories = withPermission(
    PERMISSIONS.ministry.manage,
    async (_ctx, data: { ministryId: string; orderedIds: string[] }) => {
        await prisma.$transaction(
            data.orderedIds.map((id, index) =>
                prisma.workloadCategory.update({
                    where: { id },
                    data: { sortOrder: index }
                })
            )
        );
        revalidatePath('/ministries');
    },
);

export const assignMinistryManager = withPermission(
    PERMISSIONS.ministry.manage,
    async (_ctx, ministryId: string, managerId: string | null) => {
        await prisma.ministry.update({
            where: { id: ministryId },
            data: { managerId }
        });
        revalidatePath('/ministries');
    },
);
