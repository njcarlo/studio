"use server";

import { prisma } from '@studio/database/prisma';
import { revalidatePath } from 'next/cache';
import { withPublicAction, resolveCallerCtx } from '@/lib/auth/with-permission';
import { writeAudit } from '@/lib/audit/log';
import * as TrainingService from '@/services/training';

// --- Worker-facing: view own records ---

export const getMyTrainingRecords = withPublicAction(async () => {
    const ctx = await resolveCallerCtx();
    if (!ctx) throw new Error('You must be logged in to do this.');
    return TrainingService.getTrainingRecords(ctx.workerId);
});

// --- Management: Ministry Head / Department Head / Sys Admin ---

export const getManageableWorkers = withPublicAction(async () => {
    const ctx = await resolveCallerCtx();
    if (!ctx) throw new Error('You must be logged in to do this.');
    return TrainingService.getManageableWorkers(ctx);
});

export const getTrainingRecordsForWorker = withPublicAction(async (workerId: string) => {
    const ctx = await resolveCallerCtx();
    if (!ctx) throw new Error('You must be logged in to do this.');
    if (workerId !== ctx.workerId && !(await TrainingService.canManageTrainingFor(ctx, workerId))) {
        throw new Error('You do not have permission to view this worker\'s training records.');
    }
    return TrainingService.getTrainingRecords(workerId);
});

export const createTrainingRecord = withPublicAction(
    async (input: TrainingService.CreateTrainingRecordInput) => {
        const ctx = await resolveCallerCtx();
        if (!ctx) throw new Error('You must be logged in to do this.');
        if (!(await TrainingService.canManageTrainingFor(ctx, input.workerId))) {
            throw new Error('You do not have permission to manage this worker\'s training records.');
        }

        const record = await TrainingService.createTrainingRecord(input, ctx.workerId);

        await writeAudit({
            actor: ctx,
            module: 'training',
            action: 'create_training_record',
            targetId: input.workerId,
            after: { name: record.name, status: record.status },
        });

        revalidatePath('/training');
        return record;
    },
);

export const updateTrainingRecord = withPublicAction(
    async (id: string, input: TrainingService.UpdateTrainingRecordInput) => {
        const ctx = await resolveCallerCtx();
        if (!ctx) throw new Error('You must be logged in to do this.');

        const before = await prisma.trainingRecord.findUniqueOrThrow({ where: { id } });

        if (!(await TrainingService.canManageTrainingFor(ctx, before.workerId))) {
            throw new Error('You do not have permission to manage this worker\'s training records.');
        }

        const record = await TrainingService.updateTrainingRecord(id, input);

        await writeAudit({
            actor: ctx,
            module: 'training',
            action: 'update_training_record',
            targetId: before.workerId,
            before: { name: before.name, status: before.status },
            after: { name: record.name, status: record.status },
        });

        revalidatePath('/training');
        return record;
    },
);

export const deleteTrainingRecord = withPublicAction(async (id: string) => {
    const ctx = await resolveCallerCtx();
    if (!ctx) throw new Error('You must be logged in to do this.');

    const existing = await prisma.trainingRecord.findUniqueOrThrow({ where: { id } });

    if (!(await TrainingService.canManageTrainingFor(ctx, existing.workerId))) {
        throw new Error('You do not have permission to manage this worker\'s training records.');
    }

    await TrainingService.deleteTrainingRecord(id);

    await writeAudit({
        actor: ctx,
        module: 'training',
        action: 'delete_training_record',
        targetId: existing.workerId,
        before: { name: existing.name, status: existing.status },
    });

    revalidatePath('/training');
    return id;
});
