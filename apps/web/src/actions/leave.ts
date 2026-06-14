"use server";

import { prisma } from '@studio/database/prisma';
import { revalidatePath } from 'next/cache';
import { withPublicAction, resolveCallerCtx, isHRWorker } from '@/lib/auth/with-permission';
import { PERMISSIONS } from '@/lib/permissions/registry';
import { writeAudit } from '@/lib/audit/log';
import * as LeaveWorkflow from '@/services/leave-workflow';

async function requireLeaveBalanceAccess() {
    const ctx = await resolveCallerCtx();
    if (!ctx) throw new Error('You must be logged in to do this.');
    const allowed =
        ctx.isSuperAdmin ||
        ctx.permissions.has(PERMISSIONS.hr_attendance.manage_leave_balances) ||
        (await isHRWorker(ctx.workerId));
    if (!allowed) throw new Error('You do not have permission to manage leave balances.');
    return ctx;
}

// --- Worker-facing: file requests, view own balances/history ---

export const getMyLeaveBalances = withPublicAction(async () => {
    const ctx = await resolveCallerCtx();
    if (!ctx) throw new Error('You must be logged in to do this.');
    return LeaveWorkflow.getLeaveBalances(ctx.workerId);
});

export const getMyLeaveRequests = withPublicAction(async () => {
    const ctx = await resolveCallerCtx();
    if (!ctx) throw new Error('You must be logged in to do this.');
    return prisma.leaveRequest.findMany({
        where: { workerId: ctx.workerId },
        orderBy: { createdAt: 'desc' },
    });
});

export const createLeaveRequest = withPublicAction(
    async (input: Omit<LeaveWorkflow.CreateLeaveRequestInput, 'workerId'>) => {
        const ctx = await resolveCallerCtx();
        if (!ctx) throw new Error('You must be logged in to do this.');

        const { request } = await LeaveWorkflow.createLeaveRequest({ ...input, workerId: ctx.workerId });

        revalidatePath('/leave');
        revalidatePath('/approvals');
        return request;
    },
);

// --- HR-facing: manage leave balance caps (SRD 5.10.5) ---

export const getAllLeaveBalances = withPublicAction(async (year?: number) => {
    await requireLeaveBalanceAccess();
    const y = year ?? new Date().getFullYear();

    const workers = await prisma.worker.findMany({
        where: { employmentType: 'Full-Time' },
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        orderBy: { firstName: 'asc' },
    });

    await Promise.all(
        workers.flatMap((w) => LeaveWorkflow.BALANCE_LEAVE_TYPES.map((type) => LeaveWorkflow.getOrCreateLeaveBalance(w.id, type, y))),
    );

    const balances = await prisma.leaveBalance.findMany({
        where: { year: y, workerId: { in: workers.map((w) => w.id) } },
    });

    return { workers, balances, year: y };
});

export const updateLeaveBalance = withPublicAction(
    async (workerId: string, type: string, year: number, totalDays: number) => {
        const ctx = await requireLeaveBalanceAccess();

        const before = await prisma.leaveBalance.findUnique({ where: { workerId_type_year: { workerId, type, year } } });
        const balance = await prisma.leaveBalance.upsert({
            where: { workerId_type_year: { workerId, type, year } },
            update: { totalDays, updatedBy: ctx.workerId },
            create: { workerId, type, year, totalDays, updatedBy: ctx.workerId },
        });

        await writeAudit({
            actor: ctx,
            module: 'hr_attendance',
            action: 'update_leave_balance',
            targetId: workerId,
            before: before ? { totalDays: before.totalDays } : null,
            after: { type, year, totalDays: balance.totalDays },
        });

        revalidatePath('/settings/attendance');
        return balance;
    },
);
