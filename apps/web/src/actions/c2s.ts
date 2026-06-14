"use server";

import { prisma } from '@studio/database/prisma';
import { revalidatePath } from 'next/cache';
import { withPublicAction, resolveCallerCtx } from '@/lib/auth/with-permission';
import * as ApprovalEngine from '@/services/approval-engine';
import * as C2SService from '@/services/c2s';

// --- Mentor-facing: "My Group" ---

export const getMyC2SGroup = withPublicAction(async () => {
    const ctx = await resolveCallerCtx();
    if (!ctx) throw new Error('You must be logged in to do this.');
    return C2SService.getMentorGroups(ctx.workerId);
});

export const updateMyC2SGroupProfile = withPublicAction(
    async (groupId: string, data: C2SService.UpdateGroupProfileInput) => {
        const ctx = await resolveCallerCtx();
        if (!ctx) throw new Error('You must be logged in to do this.');

        const allowed = await C2SService.canManageC2SGroup(ctx, groupId);
        if (!allowed) throw new Error('You do not have permission to update this group.');

        const group = await C2SService.updateGroupProfile(groupId, data);
        revalidatePath('/c2s');
        return group;
    },
);

export const createC2SSessionAction = withPublicAction(
    async (groupId: string, data: C2SService.CreateSessionInput) => {
        const ctx = await resolveCallerCtx();
        if (!ctx) throw new Error('You must be logged in to do this.');

        const allowed = await C2SService.canManageC2SGroup(ctx, groupId);
        if (!allowed) throw new Error('You do not have permission to record sessions for this group.');

        const session = await C2SService.createC2SSession(groupId, ctx.workerId, data);
        revalidatePath('/c2s');
        return session;
    },
);

export const getC2SSessionsForGroupAction = withPublicAction(async (groupId: string) => {
    const ctx = await resolveCallerCtx();
    if (!ctx) throw new Error('You must be logged in to do this.');

    const allowed = await C2SService.canManageC2SGroup(ctx, groupId);
    if (!allowed) throw new Error('You do not have permission to view sessions for this group.');

    return C2SService.getC2SSessionsForGroup(groupId);
});

// --- Public-facing: join requests ---

export const getPublicC2SGroups = withPublicAction(async () => {
    return C2SService.listPublicC2SGroups();
});

export const submitC2SJoinRequest = withPublicAction(async (input: C2SService.CreateJoinRequestInput) => {
    const { joinRequest } = await C2SService.createC2SJoinRequest(input);
    return joinRequest;
});

// --- Approvals integration ---

/**
 * C2S join request approval workflows, normalized into the legacy
 * ApprovalRequest shape so the existing Kanban UI on /approvals can render
 * them alongside other request types. Requester has no Worker record, so
 * `requester`/`worker` come from `workflow.metadata`.
 */
export const getC2SJoinRequestApprovals = withPublicAction(async () => {
    const ctx = await resolveCallerCtx();
    if (!ctx) throw new Error('You must be logged in to do this.');

    const [workflows, actionable] = await Promise.all([
        prisma.approvalWorkflow.findMany({
            where: { type: C2SService.C2S_JOIN_REQUEST_WORKFLOW_TYPE },
            include: { stages: { orderBy: { stageOrder: 'asc' } } },
            orderBy: { createdAt: 'desc' },
        }),
        ApprovalEngine.getActionableWorkflows(ctx.workerId),
    ]);

    const actionableIds = new Set(actionable.map((w) => w.id));

    return workflows.map((workflow) => {
        const meta = (workflow.metadata as Record<string, unknown> | null) ?? {};
        const active = ApprovalEngine.getActiveStages(workflow.stages);

        return {
            id: workflow.id,
            requester: (meta.requesterName as string) ?? 'Unknown',
            type: C2SService.C2S_JOIN_REQUEST_WORKFLOW_TYPE,
            details: `Join request for "${meta.groupName ?? 'Unknown group'}" — ${meta.requesterEmail ?? ''}${meta.message ? `: ${meta.message}` : ''}`,
            date: workflow.createdAt,
            status: workflow.status,
            workerId: null,
            requestId: workflow.subjectId,
            worker: null,
            _workflowId: workflow.id,
            _stageId: active[0]?.id ?? null,
            _actionable: actionableIds.has(workflow.id),
        };
    });
});
