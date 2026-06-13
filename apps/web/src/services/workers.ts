import { prisma } from '@studio/database/prisma';
import { CreateWorkerInput, UpdateWorkerInput } from '@/lib/schemas/worker.schemas';

// Worker Types that grant institution access (FT/OC weekday meal stubs, master schedule).
const INSTITUTION_EMPLOYMENT_TYPES = new Set(['Full-Time', 'On-Call']);

/** Derives institutionFlag from employmentType whenever employmentType is part of the write. */
function withInstitutionFlag<T extends { employmentType?: string }>(data: T): T & { institutionFlag?: boolean } {
    if (data.employmentType === undefined) return data;
    return { ...data, institutionFlag: INSTITUTION_EMPLOYMENT_TYPES.has(data.employmentType) };
}

export class WorkersService {
    static async createWorker(data: CreateWorkerInput) {
        // Strip undefined to please Prisma
        const cleanData = Object.fromEntries(Object.entries(withInstitutionFlag(data)).filter(([_, v]) => v !== undefined));
        return prisma.worker.create({ data: cleanData as any });
    }

    static async updateWorker(id: string, data: UpdateWorkerInput) {
        const cleanData = Object.fromEntries(Object.entries(withInstitutionFlag(data)).filter(([_, v]) => v !== undefined));
        return prisma.worker.update({
            where: { id },
            data: cleanData as any,
        });
    }

    static async deleteWorker(id: string) {
        return prisma.worker.delete({ where: { id } });
    }

    static async deleteWorkers(ids: string[]) {
        return prisma.worker.deleteMany({
            where: { id: { in: ids } },
        });
    }

    static async assignRolesToWorker(workerId: string, roleIds: string[]) {
        // Using a transaction to batch updates and avoid N+1 per row upserts where possible
        return prisma.$transaction(async (tx: any) => {
            // Remove roles not in the list (or all if list is empty)
            await tx.workerRole.deleteMany({
                where: {
                    workerId,
                    roleId: { notIn: roleIds }
                }
            });

            // Insert the provided roles in a single batched call (skip ones that already exist)
            if (roleIds.length > 0) {
                await tx.workerRole.createMany({
                    data: roleIds.map((roleId: string) => ({ workerId, roleId })),
                    skipDuplicates: true,
                });
            }

            // Sync the primary role ID on the worker record
            if (roleIds.length > 0) {
                await tx.worker.update({
                    where: { id: workerId },
                    data: { roleId: roleIds[0] },
                });
            } else {
                await tx.worker.update({
                    where: { id: workerId },
                    data: { roleId: null },
                });
            }
        });
    }

    static async updateWorkersMinistries(workerIds: string[], majorMinistryId?: string, minorMinistryId?: string) {
        const data: any = {};
        if (majorMinistryId !== undefined) data.majorMinistryId = majorMinistryId;
        if (minorMinistryId !== undefined) data.minorMinistryId = minorMinistryId;

        if (Object.keys(data).length === 0) return;

        return prisma.worker.updateMany({
            where: { id: { in: workerIds } },
            data,
        });
    }
}
