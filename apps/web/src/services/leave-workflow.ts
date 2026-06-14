import { prisma } from '@studio/database/prisma';
import { WORKER_FLAGS } from '@/lib/permissions/registry';
import * as ApprovalEngine from './approval-engine';
import * as MasterScheduleService from './master-schedule';
import type { ApproverSpec, WorkflowWithStages } from './approval-engine';

/**
 * Leave & Request filing (SRD 5.10.4-5.10.6), built on the generic approval
 * engine: Ministry Head -> HR (flag) -> Admin Dept Head. Vacation/Sick/Emergency
 * consume a LeaveBalance (applied when the HR stage approves, reverted if the
 * workflow is later rejected); ChangeTime/ChangeDayOff don't consume balance
 * but write a MasterScheduleOverride for `startDate` on final approval.
 * On-call workers are excluded — only Full-Time workers may file.
 */
export const LEAVE_WORKFLOW_TYPE = 'Leave Request';

export const BALANCE_LEAVE_TYPES = ['Vacation', 'Sick', 'Emergency'] as const;
export const SCHEDULE_LEAVE_TYPES = ['ChangeTime', 'ChangeDayOff'] as const;
export type LeaveType = (typeof BALANCE_LEAVE_TYPES)[number] | (typeof SCHEDULE_LEAVE_TYPES)[number];

const DEFAULT_ANNUAL_DAYS: Record<string, number> = {
    Vacation: 15,
    Sick: 15,
    Emergency: 3,
};

function startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function inclusiveDayCount(start: Date, end: Date): number {
    const ms = startOfDay(end).getTime() - startOfDay(start).getTime();
    return Math.round(ms / 86400000) + 1;
}

export async function getOrCreateLeaveBalance(workerId: string, type: string, year: number) {
    return prisma.leaveBalance.upsert({
        where: { workerId_type_year: { workerId, type, year } },
        update: {},
        create: { workerId, type, year, totalDays: DEFAULT_ANNUAL_DAYS[type] ?? 0 },
    });
}

export async function getLeaveBalances(workerId: string, year: number = new Date().getFullYear()) {
    await Promise.all(BALANCE_LEAVE_TYPES.map((type) => getOrCreateLeaveBalance(workerId, type, year)));
    return prisma.leaveBalance.findMany({ where: { workerId, year }, orderBy: { type: 'asc' } });
}

export type CreateLeaveRequestInput = {
    workerId: string;
    type: LeaveType;
    startDate: Date;
    endDate: Date;
    reason: string;
    newShiftStart?: string;
    newShiftEnd?: string;
};

export async function createLeaveRequest(input: CreateLeaveRequestInput) {
    const worker = await prisma.worker.findUniqueOrThrow({ where: { id: input.workerId } });
    if (worker.employmentType !== 'Full-Time') {
        throw new Error('Leave & Request filing is only available to Full-Time workers.');
    }

    const isScheduleType = (SCHEDULE_LEAVE_TYPES as readonly string[]).includes(input.type);
    const startDate = startOfDay(input.startDate);
    const endDate = isScheduleType ? startDate : startOfDay(input.endDate);
    if (endDate < startDate) throw new Error('End date must be on or after the start date.');

    if (input.type === 'ChangeTime' && (!input.newShiftStart || !input.newShiftEnd)) {
        throw new Error('A Change Time request requires both a new shift start and end time.');
    }

    const days = isScheduleType ? 1 : inclusiveDayCount(startDate, endDate);

    if ((BALANCE_LEAVE_TYPES as readonly string[]).includes(input.type)) {
        const balance = await getOrCreateLeaveBalance(input.workerId, input.type, startDate.getFullYear());
        const remaining = balance.totalDays - balance.usedDays;
        if (days > remaining) {
            throw new Error(`Insufficient ${input.type} leave balance (${remaining} day(s) remaining).`);
        }
    }

    const request = await prisma.leaveRequest.create({
        data: {
            workerId: input.workerId,
            type: input.type,
            startDate,
            endDate,
            reason: input.reason,
            newShiftStart: input.newShiftStart ?? null,
            newShiftEnd: input.newShiftEnd ?? null,
            days,
        },
    });

    // Admin Dept Head is an optional per-department override; falls back to
    // anyone holding the hr_attendance:approve_leave_final permission.
    const adminDept = await prisma.departmentSetting.findUnique({ where: { id: 'A' } });
    const adminHeadSpec: ApproverSpec = adminDept?.headId
        ? { kind: 'worker', workerId: adminDept.headId }
        : { kind: 'permission', module: 'hr_attendance', action: 'approve_leave_final' };

    const workflow = await ApprovalEngine.createWorkflow({
        type: LEAVE_WORKFLOW_TYPE,
        subjectId: request.id,
        requesterId: input.workerId,
        stages: [
            { approverSpec: { kind: 'ministryRole', ministryId: worker.majorMinistryId, role: 'head' } },
            { approverSpec: { kind: 'flag', flag: WORKER_FLAGS.HR } },
            { approverSpec: adminHeadSpec },
        ],
        metadata: {
            leaveType: input.type,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            days,
            reason: input.reason,
        },
    });

    await prisma.leaveRequest.update({ where: { id: request.id }, data: { workflowId: workflow.id } });

    return { request, workflow };
}

/**
 * Applies the side effects of a workflow's progress onto its LeaveRequest:
 * the HR stage (stage 2) approving a balance-consuming request increments
 * LeaveBalance.usedDays immediately; if the workflow is later rejected by the
 * Admin Dept Head, that balance is restored. A ChangeTime/ChangeDayOff
 * request writes its MasterScheduleOverride only on final approval.
 */
export async function syncLeaveStatusFromWorkflow(workflow: WorkflowWithStages): Promise<void> {
    if (workflow.type !== LEAVE_WORKFLOW_TYPE) return;

    const request = await prisma.leaveRequest.findUnique({ where: { id: workflow.subjectId } });
    if (!request) return;

    const hrStage = workflow.stages.find((s) => s.stageOrder === 2);
    const isBalanceType = (BALANCE_LEAVE_TYPES as readonly string[]).includes(request.type);
    const year = request.startDate.getFullYear();

    if (isBalanceType && hrStage?.status === 'Approved' && !request.balanceApplied) {
        await prisma.leaveBalance.update({
            where: { workerId_type_year: { workerId: request.workerId, type: request.type, year } },
            data: { usedDays: { increment: request.days } },
        });
        await prisma.leaveRequest.update({ where: { id: request.id }, data: { balanceApplied: true } });
    } else if (workflow.status === 'Rejected' && isBalanceType && request.balanceApplied) {
        await prisma.leaveBalance.update({
            where: { workerId_type_year: { workerId: request.workerId, type: request.type, year } },
            data: { usedDays: { decrement: request.days } },
        });
        await prisma.leaveRequest.update({ where: { id: request.id }, data: { balanceApplied: false } });
    }

    if (workflow.status === 'Approved' && (SCHEDULE_LEAVE_TYPES as readonly string[]).includes(request.type)) {
        await MasterScheduleService.upsertMasterScheduleOverride({
            workerId: request.workerId,
            date: request.startDate,
            shiftStart: request.type === 'ChangeTime' ? request.newShiftStart : undefined,
            shiftEnd: request.type === 'ChangeTime' ? request.newShiftEnd : undefined,
            isDayOff: request.type === 'ChangeDayOff',
            reason: request.reason,
            sourceType: 'LeaveRequest',
            sourceId: request.id,
        });
    }

    await prisma.leaveRequest.update({ where: { id: request.id }, data: { status: workflow.status } });
}
