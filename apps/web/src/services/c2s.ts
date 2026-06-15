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

/** Every C2S group with its mentees — for admins overseeing all groups from "My Group". */
export async function getAllC2SGroupsWithMentees() {
    return prisma.c2SGroup.findMany({
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

export type UpdateSessionInput = {
    date?: Date;
    module?: string | null;
    notes?: string | null;
    attendance?: { menteeId: string; present: boolean }[];
};

export async function updateC2SSession(sessionId: string, data: UpdateSessionInput) {
    const { attendance, ...rest } = data;
    return prisma.c2SSession.update({
        where: { id: sessionId },
        data: {
            ...rest,
            ...(attendance
                ? {
                    attendance: {
                        deleteMany: {},
                        create: attendance.map((a) => ({ menteeId: a.menteeId, present: a.present })),
                    },
                }
                : {}),
        },
        include: { attendance: true },
    });
}

/** Deletes a session; attendance records cascade. */
export async function deleteC2SSession(sessionId: string) {
    await prisma.c2SSession.delete({ where: { id: sessionId } });
}

export async function getSessionGroupId(sessionId: string): Promise<string> {
    const session = await prisma.c2SSession.findUniqueOrThrow({ where: { id: sessionId }, select: { groupId: true } });
    return session.groupId;
}

// --- Mentee management ---

export type MenteeInput = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: string;
    notes?: string | null;
};

export async function createMenteeInGroup(groupId: string, data: MenteeInput) {
    const group = await prisma.c2SGroup.findUniqueOrThrow({ where: { id: groupId }, select: { mentorId: true } });
    return prisma.c2SMentee.create({
        data: { ...data, notes: data.notes ?? null, groupId, mentorId: group.mentorId },
    });
}

export async function updateMentee(menteeId: string, data: Partial<MenteeInput>) {
    return prisma.c2SMentee.update({ where: { id: menteeId }, data });
}

export async function deleteMentee(menteeId: string) {
    await prisma.c2SMentee.delete({ where: { id: menteeId } });
}

export async function getMenteeGroupId(menteeId: string): Promise<string> {
    const mentee = await prisma.c2SMentee.findUniqueOrThrow({ where: { id: menteeId }, select: { groupId: true } });
    return mentee.groupId;
}

// --- Join request inbox ---

export type MentorJoinRequest = {
    workflowId: string;
    stageId: string | null;
    groupId: string;
    groupName: string;
    requesterName: string;
    requesterEmail: string;
    requesterPhone: string | null;
    message: string | null;
    createdAt: Date;
};

/** Pending C2S join-request workflows actionable by `workerId`, scoped to the groups they mentor. */
export async function getMentorJoinRequests(workerId: string): Promise<MentorJoinRequest[]> {
    const groups = await getMentorGroups(workerId);
    const groupIds = new Set(groups.map((g) => g.id));
    if (groupIds.size === 0) return [];

    const actionable = await ApprovalEngine.getActionableWorkflows(workerId);

    return actionable
        .filter((w) => w.type === C2S_JOIN_REQUEST_WORKFLOW_TYPE)
        .map((workflow) => {
            const meta = (workflow.metadata as Record<string, unknown> | null) ?? {};
            return { workflow, meta };
        })
        .filter(({ meta }) => groupIds.has(meta.groupId as string))
        .map(({ workflow, meta }) => ({
            workflowId: workflow.id,
            stageId: ApprovalEngine.getActiveStages(workflow.stages)[0]?.id ?? null,
            groupId: meta.groupId as string,
            groupName: meta.groupName as string,
            requesterName: meta.requesterName as string,
            requesterEmail: meta.requesterEmail as string,
            requesterPhone: (meta.requesterPhone as string | null) ?? null,
            message: (meta.message as string | null) ?? null,
            createdAt: workflow.createdAt,
        }));
}
