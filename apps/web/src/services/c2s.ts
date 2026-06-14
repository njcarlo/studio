import { prisma } from '@studio/database/prisma';
import type { CallerCtx } from '@/lib/auth/with-permission';
import * as ApprovalEngine from './approval-engine';
import type { WorkflowWithStages } from './approval-engine';

/**
 * C2S mentor features (SRD 5.12): mentor-editable group profile, anonymous
 * join requests routed through the approval engine, and per-session
 * attendance tracking.
 */
export const C2S_JOIN_REQUEST_WORKFLOW_TYPE = 'C2S Join Request';

/** True if `ctx` may manage `groupId` — Super Admin, mentorship:manage, or the group's own mentor. */
export async function canManageC2SGroup(ctx: CallerCtx, groupId: string): Promise<boolean> {
    if (ctx.isSuperAdmin || ctx.permissions.has('mentorship:manage')) return true;
    const group = await prisma.c2SGroup.findUnique({ where: { id: groupId }, select: { mentorId: true } });
    return group?.mentorId === ctx.workerId;
}

/** The C2S group(s) led by `workerId`, with their mentees. */
export async function getMentorGroups(workerId: string) {
    return prisma.c2SGroup.findMany({
        where: { mentorId: workerId },
        include: { mentees: true },
        orderBy: { name: 'asc' },
    });
}

export type UpdateGroupProfileInput = {
    location?: string | null;
    meetingSchedule?: string | null;
    currentModule?: string | null;
};

export async function updateGroupProfile(groupId: string, data: UpdateGroupProfileInput) {
    return prisma.c2SGroup.update({ where: { id: groupId }, data });
}

/** Public group directory for the join-request page — no mentor PII. */
export async function listPublicC2SGroups() {
    return prisma.c2SGroup.findMany({
        select: { id: true, name: true, location: true, meetingSchedule: true, currentModule: true },
        orderBy: { name: 'asc' },
    });
}

export type CreateJoinRequestInput = {
    groupId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    message?: string;
};

/** Anonymous public submission — creates the request and a single-stage approval workflow for the group's mentor. */
export async function createC2SJoinRequest(input: CreateJoinRequestInput) {
    const group = await prisma.c2SGroup.findUniqueOrThrow({ where: { id: input.groupId } });

    const joinRequest = await prisma.c2SJoinRequest.create({
        data: {
            groupId: input.groupId,
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            phone: input.phone ?? null,
            message: input.message ?? null,
        },
    });

    const workflow = await ApprovalEngine.createWorkflow({
        type: C2S_JOIN_REQUEST_WORKFLOW_TYPE,
        subjectId: joinRequest.id,
        requesterId: `c2s-join:${joinRequest.id}`,
        stages: [
            {
                approverSpec: group.mentorId
                    ? { kind: 'worker', workerId: group.mentorId }
                    : { kind: 'permission', module: 'mentorship', action: 'manage' },
            },
        ],
        metadata: {
            requesterName: `${input.firstName} ${input.lastName}`,
            requesterEmail: input.email,
            requesterPhone: input.phone ?? null,
            message: input.message ?? null,
            groupId: group.id,
            groupName: group.name,
        },
    });

    await prisma.c2SJoinRequest.update({ where: { id: joinRequest.id }, data: { workflowId: workflow.id } });

    return { joinRequest, workflow };
}

/** On Approved: creates a C2SMentee for the group from the request's details. On Rejected: just updates status. */
export async function syncC2SJoinRequestFromWorkflow(workflow: WorkflowWithStages): Promise<void> {
    if (workflow.type !== C2S_JOIN_REQUEST_WORKFLOW_TYPE) return;

    const joinRequest = await prisma.c2SJoinRequest.findUnique({ where: { id: workflow.subjectId } });
    if (!joinRequest) return;

    if (workflow.status === 'Approved') {
        const group = await prisma.c2SGroup.findUniqueOrThrow({ where: { id: joinRequest.groupId } });
        await prisma.c2SMentee.create({
            data: {
                firstName: joinRequest.firstName,
                lastName: joinRequest.lastName,
                email: joinRequest.email,
                phone: joinRequest.phone ?? '',
                status: 'In Progress',
                groupId: joinRequest.groupId,
                mentorId: group.mentorId,
            },
        });
    }

    if (workflow.status === 'Approved' || workflow.status === 'Rejected') {
        await prisma.c2SJoinRequest.update({ where: { id: joinRequest.id }, data: { status: workflow.status } });
    }
}

export type CreateSessionInput = {
    date: Date;
    module?: string | null;
    notes?: string | null;
    attendance: { menteeId: string; present: boolean }[];
};

export async function createC2SSession(groupId: string, createdBy: string, input: CreateSessionInput) {
    return prisma.c2SSession.create({
        data: {
            groupId,
            date: input.date,
            module: input.module ?? null,
            notes: input.notes ?? null,
            createdBy,
            attendance: {
                create: input.attendance.map((a) => ({ menteeId: a.menteeId, present: a.present })),
            },
        },
        include: { attendance: true },
    });
}

/** Sessions for a group, newest first, with attendance. */
export async function getC2SSessionsForGroup(groupId: string) {
    return prisma.c2SSession.findMany({
        where: { groupId },
        include: { attendance: true },
        orderBy: { date: 'desc' },
    });
}
