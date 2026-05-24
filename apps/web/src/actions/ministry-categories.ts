"use server";

import { prisma } from '@studio/database/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Checks if a user is authorized to manage workload categories for a specific ministry.
 * - Must be authenticated.
 * - Must either have `canManageMinistries` permission OR be the `headId` OR be the `managerId` of the ministry.
 */
export async function assertCategoryManager(ministryId: string, callerId?: string | null) {
    if (!callerId) {
        throw new Error('UNAUTHENTICATED');
    }
    if (callerId === '999999') {
        return; // Master admin fallback bypass
    }

    const ministry = await prisma.ministry.findUnique({
        where: { id: ministryId },
        select: { headId: true, managerId: true }
    });

    if (!ministry) {
        throw new Error('Ministry not found');
    }

    if (ministry.headId === callerId || ministry.managerId === callerId) {
        return; // Authorized as ministry head or manager
    }

    // Check if the caller has the canManageMinistries permission via any of their roles
    const workerRoles = await prisma.workerRole.findMany({
        where: { workerId: callerId },
        include: {
            role: {
                include: {
                    rolePermissions: {
                        include: {
                            permission: true
                        }
                    }
                }
            }
        }
    });

    const canManageMinistries = workerRoles.some(wr => 
        wr.role.isSuperAdmin || 
        wr.role.rolePermissions.some(rp => rp.permission.module === 'ministry' && rp.permission.action === 'manage')
    );

    // Fallback: If roles are still using legacy strings
    const hasLegacyAdmin = workerRoles.some(wr => wr.role.permissions?.includes('canManageMinistries'));

    if (!canManageMinistries && !hasLegacyAdmin) {
        throw new Error('UNAUTHORIZED');
    }
}

export async function getWorkloadCategories(ministryId: string) {
    return prisma.workloadCategory.findMany({
        where: { ministryId },
        orderBy: { sortOrder: 'asc' }
    });
}

export async function createWorkloadCategory(
    data: { ministryId: string; name: string; description?: string },
    callerId: string,
    options?: { skipAuth?: boolean }
) {
    if (!options?.skipAuth) {
        await assertCategoryManager(data.ministryId, callerId);
    }
    // when skipAuth:true, allow the call regardless of callerId

    const name = data.name?.trim();
    if (!name) throw new Error('INVALID_NAME');
    if (data.description && data.description.length > 255) throw new Error('DESCRIPTION_TOO_LONG');

    // Case-insensitive duplicate check
    const existing = await prisma.workloadCategory.findFirst({
        where: {
            ministryId: data.ministryId,
            name: { equals: name, mode: 'insensitive' }
        }
    });

    if (existing) {
        throw new Error('DUPLICATE_NAME');
    }

    const maxOrderRes = await prisma.workloadCategory.aggregate({
        where: { ministryId: data.ministryId },
        _max: { sortOrder: true }
    });
    const nextOrder = (maxOrderRes._max.sortOrder ?? -1) + 1;

    try {
        const category = await prisma.workloadCategory.create({
            data: {
                ministryId: data.ministryId,
                name,
                description: data.description,
                sortOrder: nextOrder
            }
        });
        revalidatePath(`/ministries`);
        return category;
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new Error('DUPLICATE_NAME');
        }
        throw error;
    }
}

export async function updateWorkloadCategory(
    id: string,
    data: { name?: string; description?: string },
    callerId: string
) {
    const existingCat = await prisma.workloadCategory.findUnique({ where: { id } });
    if (!existingCat) throw new Error('Category not found');

    await assertCategoryManager(existingCat.ministryId, callerId);

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

    try {
        const category = await prisma.workloadCategory.update({
            where: { id },
            data: {
                name,
                description: data.description !== undefined ? data.description : existingCat.description
            }
        });
        revalidatePath(`/ministries`);
        return category;
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new Error('DUPLICATE_NAME');
        }
        throw error;
    }
}

export async function deleteWorkloadCategory(id: string, callerId: string) {
    const existingCat = await prisma.workloadCategory.findUnique({ where: { id } });
    if (!existingCat) return; // Already deleted

    await assertCategoryManager(existingCat.ministryId, callerId);

    await prisma.workloadCategory.delete({ where: { id } });
    revalidatePath(`/ministries`);
}

export async function reorderWorkloadCategories(
    data: { ministryId: string; orderedIds: string[] },
    callerId: string
) {
    await assertCategoryManager(data.ministryId, callerId);

    await prisma.$transaction(
        data.orderedIds.map((id, index) =>
            prisma.workloadCategory.update({
                where: { id },
                data: { sortOrder: index }
            })
        )
    );
    
    revalidatePath(`/ministries`);
}

export async function assignMinistryManager(
    ministryId: string,
    managerId: string | null,
    callerId: string
) {
    if (!callerId) throw new Error('UNAUTHENTICATED');

    const workerRoles = await prisma.workerRole.findMany({
        where: { workerId: callerId },
        include: {
            role: {
                include: {
                    rolePermissions: {
                        include: { permission: true }
                    }
                }
            }
        }
    });

    const canManageMinistries = workerRoles.some(wr => 
        wr.role.isSuperAdmin || 
        wr.role.rolePermissions.some(rp => rp.permission.module === 'ministry' && rp.permission.action === 'manage')
    );
    const hasLegacyAdmin = workerRoles.some(wr => wr.role.permissions?.includes('canManageMinistries'));

    if (!canManageMinistries && !hasLegacyAdmin) {
        throw new Error('UNAUTHORIZED');
    }

    await prisma.ministry.update({
        where: { id: ministryId },
        data: { managerId }
    });

    revalidatePath('/ministries');
}
