import { prisma } from '@studio/database/prisma';
import type { ApprovalStage, ApprovalWorkflow } from '@prisma/client';
import { EmailService } from './email-service';

/**
 * Generic, multi-stage approval workflow engine (Layer 2).
 *
 * New workflow types (Room Reservation, Major Event, Leave Request, Minor
 * Ministry assignment, ...) are added by passing a different `stages`
 * template to createWorkflow() — no schema changes required. Type-specific
 * side effects (e.g. updating a Booking's status on approval) are handled by
 * the caller via the return value of decide()/createWorkflow(), not here.
 */

export type ApproverSpec =
    | { kind: 'worker'; workerId: string }
    | { kind: 'permission'; module: string; action: string }
    | { kind: 'ministryRole'; ministryId: string; role: 'head' | 'manager' | 'approver' | 'scheduler' }
    | { kind: 'flag'; flag: string };

export type StageTemplate = {
    approverSpec: ApproverSpec;
    /**
     * Stages sharing a parallelGroup become active together and must all be
     * decided before the workflow advances past the group (e.g. Major
     * Event's per-ministry approval stages).
     */
    parallelGroup?: number;
};

export type CreateWorkflowInput = {
    type: string;
    subjectId: string;
    requesterId: string;
    stages: StageTemplate[];
    metadata?: Record<string, unknown>;
};

export type WorkflowWithStages = ApprovalWorkflow & { stages: ApprovalStage[] };

/**
 * The stages currently awaiting a decision. For sequential stages this is a
 * single stage; for a parallel group it's every still-pending stage in that
 * group.
 */
export function getActiveStages(stages: ApprovalStage[]): ApprovalStage[] {
    const pending = stages.filter((s) => s.status === 'Pending');
    if (pending.length === 0) return [];

    const minOrder = Math.min(...pending.map((s) => s.stageOrder));
    const head = stages.find((s) => s.stageOrder === minOrder)!;

    if (head.parallelGroup == null) return [head];
    return pending.filter((s) => s.parallelGroup === head.parallelGroup);
}

export async function createWorkflow(input: CreateWorkflowInput): Promise<WorkflowWithStages> {
    if (input.stages.length === 0) {
        throw new Error('A workflow requires at least one stage');
    }

    const workflow = await prisma.approvalWorkflow.create({
        data: {
            type: input.type,
            subjectId: input.subjectId,
            requesterId: input.requesterId,
            metadata: (input.metadata ?? undefined) as any,
            stages: {
                create: input.stages.map((stage, index) => ({
                    stageOrder: index + 1,
                    parallelGroup: stage.parallelGroup ?? null,
                    approverSpec: stage.approverSpec as any,
                })),
            },
        },
        include: { stages: { orderBy: { stageOrder: 'asc' } } },
    });

    await notifyActiveStageApprovers(workflow);
    return workflow;
}

export type DecideInput = {
    stageId: string;
    workerId: string;
    decision: 'approve' | 'reject';
    reason?: string;
};

export async function decide(input: DecideInput): Promise<WorkflowWithStages> {
    const { stageId, workerId, decision, reason } = input;

    if (decision === 'reject' && !reason?.trim()) {
        throw new Error('A reason is required to reject a stage');
    }

    const workflow = await prisma.$transaction(async (tx) => {
        const stage = await tx.approvalStage.findUniqueOrThrow({
            where: { id: stageId },
            include: { workflow: { include: { stages: { orderBy: { stageOrder: 'asc' } } } } },
        });

        if (stage.workflow.status !== 'Pending') {
            throw new Error(`Workflow is already ${stage.workflow.status}`);
        }
        if (stage.status !== 'Pending') {
            throw new Error(`Stage is already ${stage.status}`);
        }

        const active = getActiveStages(stage.workflow.stages);
        if (!active.some((s) => s.id === stageId)) {
            throw new Error('This stage is not currently actionable');
        }

        const authorized = await canActOnStage(stage, workerId);
        if (!authorized) {
            throw new Error('Not authorized to decide this stage');
        }

        await tx.approvalStage.update({
            where: { id: stageId },
            data: {
                status: decision === 'approve' ? 'Approved' : 'Rejected',
                decidedBy: workerId,
                decidedAt: new Date(),
                reason: reason ?? null,
            },
        });

        const refreshed = await tx.approvalWorkflow.findUniqueOrThrow({
            where: { id: stage.workflowId },
            include: { stages: { orderBy: { stageOrder: 'asc' } } },
        });

        // Rejecting a sequential stage rejects the whole workflow (Room
        // Reservation, Leave Request). Rejecting a stage that's part of a
        // parallel group (Major Event's per-ministry stages) only rejects
        // that ministry's stage — other stages' decisions are retained and
        // the workflow keeps moving once the rest of the group is decided.
        if (decision === 'reject' && stage.parallelGroup == null) {
            return tx.approvalWorkflow.update({
                where: { id: refreshed.id },
                data: { status: 'Rejected' },
                include: { stages: { orderBy: { stageOrder: 'asc' } } },
            });
        }

        if (getActiveStages(refreshed.stages).length === 0) {
            return tx.approvalWorkflow.update({
                where: { id: refreshed.id },
                data: { status: 'Approved' },
                include: { stages: { orderBy: { stageOrder: 'asc' } } },
            });
        }

        return refreshed;
    });

    if (decision === 'reject' && workflow.status === 'Pending') {
        // Parallel-group stage was rejected but the workflow itself is still
        // Pending (other stages/groups continue) — let the requester know
        // about this specific decline now rather than waiting for the
        // workflow's terminal notification.
        const rejectedStage = workflow.stages.find((s: ApprovalStage) => s.id === stageId);
        if (rejectedStage) await notifyStageRejected(workflow, rejectedStage);
    }

    if (workflow.status === 'Pending') {
        await notifyActiveStageApprovers(workflow);
    } else {
        await notifyRequester(workflow);
    }

    return workflow;
}

/** Workflows where the given worker can currently act on the active stage(s). */
export async function getActionableWorkflows(workerId: string): Promise<WorkflowWithStages[]> {
    const workflows = await prisma.approvalWorkflow.findMany({
        where: { status: 'Pending' },
        include: { stages: { orderBy: { stageOrder: 'asc' } } },
    });

    const actionable: WorkflowWithStages[] = [];
    for (const workflow of workflows) {
        const active = getActiveStages(workflow.stages);
        for (const stage of active) {
            if (await canActOnStage(stage, workerId)) {
                actionable.push(workflow);
                break;
            }
        }
    }
    return actionable;
}

/** Whether `workerId` is currently authorized to decide `stage` (per its approverSpec, or Super Admin). */
export async function canActOnStage(stage: ApprovalStage, workerId: string): Promise<boolean> {
    const spec = stage.approverSpec as unknown as ApproverSpec;

    // Super Admins can act on any stage — backstops ministryRole/flag specs
    // that have no assigned worker yet (e.g. a ministry with no head set).
    if (await isSuperAdmin(workerId)) return true;

    switch (spec.kind) {
        case 'worker':
            return spec.workerId === workerId;

        case 'permission':
            return workerHasPermission(workerId, spec.module, spec.action);

        case 'ministryRole': {
            const ministry = await prisma.ministry.findUnique({ where: { id: spec.ministryId } });
            if (!ministry) return false;
            switch (spec.role) {
                case 'head': return ministry.headId === workerId;
                case 'manager': return ministry.managerId === workerId;
                case 'approver': return ministry.approverId === workerId;
                case 'scheduler': return ministry.schedulerIds.includes(workerId);
            }
        }

        case 'flag': {
            const worker = await prisma.worker.findUnique({ where: { id: workerId } });
            return worker ? worker.flags.includes(spec.flag) : false;
        }
    }
}

async function isSuperAdmin(workerId: string): Promise<boolean> {
    const worker = await prisma.worker.findUnique({
        where: { id: workerId },
        include: { roles: { include: { role: true } } },
    });
    return worker?.roles.some((wr) => wr.role.isSuperAdmin) ?? false;
}

async function workerHasPermission(workerId: string, module: string, action: string): Promise<boolean> {
    const worker = await prisma.worker.findUnique({
        where: { id: workerId },
        include: {
            roles: {
                include: {
                    role: { include: { rolePermissions: { include: { permission: true } } } },
                },
            },
        },
    });
    if (!worker) return false;

    if (worker.roles.some((wr) => wr.role.isSuperAdmin)) return true;

    return worker.roles.some((wr) =>
        wr.role.rolePermissions.some(
            (rp) => rp.permission.module === module && rp.permission.action === action,
        ),
    );
}

/** Workers eligible to act on a stage, used for notification fan-out. */
async function resolveStageApprovers(stage: ApprovalStage): Promise<{ id: string; email: string }[]> {
    const spec = stage.approverSpec as unknown as ApproverSpec;

    switch (spec.kind) {
        case 'worker': {
            const worker = await prisma.worker.findUnique({ where: { id: spec.workerId } });
            return worker ? [{ id: worker.id, email: worker.email }] : [];
        }

        case 'permission': {
            const workers = await prisma.worker.findMany({
                where: {
                    status: 'Active',
                    roles: {
                        some: {
                            role: {
                                OR: [
                                    { isSuperAdmin: true },
                                    { rolePermissions: { some: { permission: { module: spec.module, action: spec.action } } } },
                                ],
                            },
                        },
                    },
                },
                select: { id: true, email: true },
            });
            return workers;
        }

        case 'ministryRole': {
            const ministry = await prisma.ministry.findUnique({ where: { id: spec.ministryId } });
            if (!ministry) return [];
            const ids = spec.role === 'scheduler'
                ? ministry.schedulerIds
                : [ministry[`${spec.role}Id` as 'headId' | 'managerId' | 'approverId']].filter(Boolean) as string[];
            if (ids.length === 0) return [];
            const workers = await prisma.worker.findMany({
                where: { id: { in: ids } },
                select: { id: true, email: true },
            });
            return workers;
        }

        case 'flag': {
            const workers = await prisma.worker.findMany({
                where: { status: 'Active', flags: { has: spec.flag } },
                select: { id: true, email: true },
            });
            return workers;
        }
    }
}

async function notifyActiveStageApprovers(workflow: WorkflowWithStages): Promise<void> {
    try {
        const active = getActiveStages(workflow.stages);
        const recipients = new Map<string, string>();
        for (const stage of active) {
            for (const w of await resolveStageApprovers(stage)) {
                if (w.email) recipients.set(w.id, w.email);
            }
        }
        if (recipients.size === 0) return;

        await prisma.inAppNotification.createMany({
            data: [...recipients.keys()].map((userId) => ({
                userId,
                title: `Approval needed: ${workflow.type}`,
                body: `A ${workflow.type} request requires your review.`,
                link: '/approvals',
            })),
        });

        await EmailService.sendEmail({
            to: [...recipients.values()],
            subject: `[Approval Required] ${workflow.type} request`,
            html: `<p>A <strong>${workflow.type}</strong> request requires your review.</p>`,
            text: `A ${workflow.type} request requires your review.`,
        });
    } catch (error) {
        console.error('Failed to notify approval stage approvers:', error);
    }
}

/** Notifies the requester that one stage of a parallel group was declined, without waiting for the workflow's terminal outcome. */
async function notifyStageRejected(workflow: WorkflowWithStages, stage: ApprovalStage): Promise<void> {
    try {
        const requester = await prisma.worker.findUnique({ where: { id: workflow.requesterId } });
        if (!requester) return;

        const title = `${workflow.type} request: part declined`;
        const body = stage.reason
            ? `One part of your ${workflow.type} request was declined: ${stage.reason}`
            : `One part of your ${workflow.type} request was declined.`;

        await prisma.inAppNotification.create({
            data: { userId: requester.id, title, body, link: '/approvals' },
        });

        if (requester.email) {
            await EmailService.sendEmail({
                to: requester.email,
                subject: `[Studio] ${title}`,
                html: `<p>${body}</p>`,
                text: body,
            });
        }
    } catch (error) {
        console.error('Failed to notify approval requester of stage rejection:', error);
    }
}

async function notifyRequester(workflow: WorkflowWithStages): Promise<void> {
    try {
        const requester = await prisma.worker.findUnique({ where: { id: workflow.requesterId } });
        if (!requester) return;

        const title = `${workflow.type} request ${workflow.status.toLowerCase()}`;
        const rejectedStage = workflow.stages.find((s) => s.status === 'Rejected');
        const body = workflow.status === 'Rejected' && rejectedStage?.reason
            ? `Your ${workflow.type} request was rejected: ${rejectedStage.reason}`
            : `Your ${workflow.type} request has been ${workflow.status.toLowerCase()}.`;

        await prisma.inAppNotification.create({
            data: { userId: requester.id, title, body, link: '/approvals' },
        });

        if (requester.email) {
            await EmailService.sendEmail({
                to: requester.email,
                subject: `[Studio] ${title}`,
                html: `<p>${body}</p>`,
                text: body,
            });
        }
    } catch (error) {
        console.error('Failed to notify approval requester:', error);
    }
}
