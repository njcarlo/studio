import 'server-only';
import { prisma } from '@studio/database/prisma';
import { configureAuthUserGetter, resolveCallerCtx, type CallerCtx } from '@studio/core-engine';
import { initialsOf } from '@studio/c2s';
import { getServerUser } from './firebase-auth-server';
import type { User, UserRole } from './session-user';

// Every server action in this app resolves its caller through core-engine, so
// the auth-user getter has to be configured before the first one runs.
configureAuthUserGetter(getServerUser);

export type { User, UserRole } from './session-user';
export { ROLE_LABELS } from './session-user';

/**
 * The caller's C2S role, derived from real data rather than a hardcoded list:
 * the ministry-wide `mentorship:manage` permission, then cluster headship,
 * then a coordinator assignment, then a mentor assignment or an owned group.
 */
async function resolveRole(ctx: CallerCtx): Promise<{
    role: UserRole;
    clusterId?: string;
    clusterName?: string;
    groupId?: string;
    groupName?: string;
} | null> {
    if (ctx.isSuperAdmin || ctx.permissions.has('mentorship:manage')) {
        return { role: 'ministry_head' };
    }

    const headed = await prisma.c2SCluster.findFirst({ where: { clusterHeadId: ctx.workerId } });
    if (headed) {
        return { role: 'cluster_head', clusterId: headed.id, clusterName: headed.name };
    }

    const coordinating = await prisma.c2SCoordinatorAssignment.findFirst({
        where: { workerId: ctx.workerId, status: 'Active' },
        include: { cluster: true },
    });
    if (coordinating) {
        return {
            role: 'c2s_coordinator',
            clusterId: coordinating.clusterId,
            clusterName: coordinating.cluster.name,
        };
    }

    const [mentoring, groups] = await Promise.all([
        prisma.c2SMentorAssignment.findFirst({
            where: { workerId: ctx.workerId, status: 'Active' },
            include: { cluster: true },
        }),
        prisma.c2SGroup.findMany({ where: { mentorId: ctx.workerId }, select: { id: true, name: true } }),
    ]);

    if (mentoring || groups.length > 0) {
        return {
            role: 'mentor',
            clusterId: mentoring?.clusterId,
            clusterName: mentoring?.cluster.name,
            // Only surface a single group as "the" mentor's group.
            groupId: groups.length === 1 ? groups[0].id : undefined,
            groupName: groups.length === 1 ? groups[0].name : undefined,
        };
    }

    return null;
}

/**
 * The signed-in C2S user, or null when signed out or when the worker holds no
 * C2S role. Dashboard pages redirect to /login on null.
 */
export async function getC2SUser(): Promise<User | null> {
    const ctx = await resolveCallerCtx();
    if (!ctx) return null;

    const [worker, resolved] = await Promise.all([
        prisma.worker.findUnique({
            where: { id: ctx.workerId },
            select: { firstName: true, lastName: true },
        }),
        resolveRole(ctx),
    ]);
    if (!worker || !resolved) return null;

    return {
        id: ctx.workerId,
        name: `${worker.firstName} ${worker.lastName}`.trim(),
        email: ctx.email,
        role: resolved.role,
        avatar: initialsOf(worker.firstName, worker.lastName),
        group: resolved.groupName,
        groupId: resolved.groupId,
        cluster: resolved.clusterName,
        clusterId: resolved.clusterId,
    };
}
