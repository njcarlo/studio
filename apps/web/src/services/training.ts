import { prisma } from '@studio/database/prisma';
import { canManageWorkersInMinistries, type CallerCtx } from '@/lib/auth/with-permission';
import { PERMISSIONS } from '@/lib/permissions/registry';

/**
 * Training Management (SRD 5.9), record-only in v1 (Open Decision #2): no
 * scheduler integration / blocking. Managed by Ministry Head / Department
 * Head / Sys Admin for workers in their ministry/department; every worker
 * can view their own records.
 */

export async function getTrainingRecords(workerId: string) {
    return prisma.trainingRecord.findMany({
        where: { workerId },
        orderBy: { createdAt: 'desc' },
    });
}

/** True if `ctx` may manage TrainingRecords belonging to `targetWorkerId`. */
export async function canManageTrainingFor(ctx: CallerCtx, targetWorkerId: string): Promise<boolean> {
    if (ctx.isSuperAdmin) return true;
    if (ctx.permissions.has(PERMISSIONS.training.manage)) return true;

    const target = await prisma.worker.findUnique({
        where: { id: targetWorkerId },
        select: { majorMinistryId: true, minorMinistryId: true },
    });
    if (!target) return false;

    if (await canManageWorkersInMinistries(ctx, [target.majorMinistryId, target.minorMinistryId])) return true;

    const ministry = await prisma.ministry.findUnique({
        where: { id: target.majorMinistryId },
        select: { departmentCode: true },
    });
    if (ministry) {
        const dept = await prisma.departmentSetting.findUnique({ where: { id: ministry.departmentCode } });
        if (dept?.headId === ctx.workerId) return true;
    }
    return false;
}

/** Workers whose TrainingRecords `ctx` is allowed to manage. */
export async function getManageableWorkers(ctx: CallerCtx) {
    const select = { id: true, firstName: true, lastName: true, avatarUrl: true, majorMinistryId: true } as const;

    if (ctx.isSuperAdmin || ctx.permissions.has(PERMISSIONS.training.manage)) {
        return prisma.worker.findMany({ where: { status: 'Active' }, select, orderBy: { firstName: 'asc' } });
    }

    const headedMinistries = await prisma.ministry.findMany({
        where: { OR: [{ headId: ctx.workerId }, { approverId: ctx.workerId }] },
        select: { id: true, departmentCode: true },
    });

    const headedDepartments = await prisma.departmentSetting.findMany({
        where: { headId: ctx.workerId },
        select: { id: true },
    });

    const departmentCodes = new Set<string>([
        ...headedMinistries.map((m) => m.departmentCode),
        ...headedDepartments.map((d) => d.id),
    ]);

    const ministriesInDepartments = departmentCodes.size > 0
        ? await prisma.ministry.findMany({ where: { departmentCode: { in: [...departmentCodes] } }, select: { id: true } })
        : [];

    const ministryIds = new Set<string>([
        ...headedMinistries.map((m) => m.id),
        ...ministriesInDepartments.map((m) => m.id),
    ]);

    if (ministryIds.size === 0) return [];

    return prisma.worker.findMany({
        where: {
            status: 'Active',
            OR: [
                { majorMinistryId: { in: [...ministryIds] } },
                { minorMinistryId: { in: [...ministryIds] } },
            ],
        },
        select,
        orderBy: { firstName: 'asc' },
    });
}

export type CreateTrainingRecordInput = {
    workerId: string;
    name: string;
    dateCompleted?: Date | null;
    expiryDate?: Date | null;
    status?: string;
    notes?: string | null;
};

export async function createTrainingRecord(input: CreateTrainingRecordInput, recordedBy: string) {
    return prisma.trainingRecord.create({
        data: {
            workerId: input.workerId,
            name: input.name,
            dateCompleted: input.dateCompleted ?? null,
            expiryDate: input.expiryDate ?? null,
            status: input.status ?? 'Completed',
            notes: input.notes ?? null,
            recordedBy,
        },
    });
}

export type UpdateTrainingRecordInput = Partial<Omit<CreateTrainingRecordInput, 'workerId'>>;

export async function updateTrainingRecord(id: string, input: UpdateTrainingRecordInput) {
    return prisma.trainingRecord.update({
        where: { id },
        data: {
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.dateCompleted !== undefined ? { dateCompleted: input.dateCompleted } : {}),
            ...(input.expiryDate !== undefined ? { expiryDate: input.expiryDate } : {}),
            ...(input.status !== undefined ? { status: input.status } : {}),
            ...(input.notes !== undefined ? { notes: input.notes } : {}),
        },
    });
}

export async function deleteTrainingRecord(id: string) {
    return prisma.trainingRecord.delete({ where: { id } });
}
