import { prisma } from '@studio/database/prisma';
import * as ApprovalEngine from './approval-engine';
import type { ApproverSpec, WorkflowWithStages } from './approval-engine';

/**
 * Major Event Request (SRD 5.11), built on the generic approval engine:
 * one parallel-group stage per providing ministry's Ministry Head (Team
 * Leaders are cc'd via notification only, not as approvers), followed by a
 * sequential Admin Dept Head final stage. A providing ministry's rejection
 * only declines that ministry's items — see approval-engine's parallel-group
 * reject handling.
 */
export const MAJOR_EVENT_WORKFLOW_TYPE = 'Major Event';

export type CreateMajorEventRequestItemInput = {
    catalogItemId?: string | null;
    ministryId: string;
    name: string;
    notes?: string | null;
    quantity?: number | null;
};

export type CreateMajorEventRequestInput = {
    title: string;
    description?: string | null;
    eventDate: Date;
    endDate?: Date | null;
    location?: string | null;
    requesterId: string;
    ministryId: string;
    items: CreateMajorEventRequestItemInput[];
};

export async function createMajorEventRequest(input: CreateMajorEventRequestInput) {
    const providingMinistryIds = [...new Set(input.items.map((item) => item.ministryId))];
    if (providingMinistryIds.length === 0) {
        throw new Error('A Major Event request requires at least one service item');
    }

    const request = await prisma.majorEventRequest.create({
        data: {
            title: input.title,
            description: input.description ?? null,
            eventDate: input.eventDate,
            endDate: input.endDate ?? null,
            location: input.location ?? null,
            requesterId: input.requesterId,
            ministryId: input.ministryId,
            items: {
                create: input.items.map((item) => ({
                    catalogItemId: item.catalogItemId ?? null,
                    ministryId: item.ministryId,
                    name: item.name,
                    notes: item.notes ?? null,
                    quantity: item.quantity ?? null,
                })),
            },
        },
        include: { items: true },
    });

    // Admin Dept Head is an optional per-department override; falls back to
    // anyone holding the major_events:approve_final permission.
    const adminDept = await prisma.departmentSetting.findUnique({ where: { id: 'A' } });
    const adminHeadSpec: ApproverSpec = adminDept?.headId
        ? { kind: 'worker', workerId: adminDept.headId }
        : { kind: 'permission', module: 'major_events', action: 'approve_final' };

    const workflow = await ApprovalEngine.createWorkflow({
        type: MAJOR_EVENT_WORKFLOW_TYPE,
        subjectId: request.id,
        requesterId: input.requesterId,
        stages: [
            ...providingMinistryIds.map((ministryId): ApprovalEngine.StageTemplate => ({
                approverSpec: { kind: 'ministryRole', ministryId, role: 'head' },
                parallelGroup: 1,
            })),
            { approverSpec: adminHeadSpec },
        ],
        metadata: {
            title: input.title,
            eventDate: input.eventDate.toISOString(),
            ministryIds: providingMinistryIds,
        },
    });

    return { request, workflow };
}

/** Major Event requests don't have a separate "Pending Ministry/Admin" split — the workflow's own status is the request status. */
export function majorEventStatusForWorkflow(workflow: WorkflowWithStages): string {
    return workflow.status;
}

/**
 * Syncs the request's overall status from the workflow, and each providing
 * ministry's parallel-group stage decision onto that ministry's items
 * (Approved / Declined), independently of the workflow's overall outcome.
 */
export async function syncMajorEventStatusFromWorkflow(workflow: WorkflowWithStages): Promise<void> {
    if (workflow.type !== MAJOR_EVENT_WORKFLOW_TYPE) return;

    await prisma.majorEventRequest.update({
        where: { id: workflow.subjectId },
        data: { status: majorEventStatusForWorkflow(workflow) },
    });

    for (const stage of workflow.stages) {
        if (stage.parallelGroup == null || stage.status === 'Pending') continue;

        const spec = stage.approverSpec as unknown as ApproverSpec;
        if (spec.kind !== 'ministryRole') continue;

        await prisma.majorEventRequestItem.updateMany({
            where: { requestId: workflow.subjectId, ministryId: spec.ministryId },
            data: { status: stage.status === 'Approved' ? 'Approved' : 'Declined' },
        });
    }
}
