import { prisma } from '@studio/database/prisma';

/**
 * C2S outreach hierarchy — clusters, coordinators, mentors and the
 * potential-mentee pipeline that feed the four role dashboards
 * (ministry head, cluster head, coordinator, mentor).
 *
 * Everything here is a plain read/write over Prisma; permission checks live in
 * the calling server actions via `withPermission` from @studio/core-engine.
 */

// --- Shared helpers ---------------------------------------------------------

/** "Juan Dela Cruz" → "JD". Used for the avatar chips across every dashboard. */
export function initialsOf(firstName: string, lastName?: string): string {
    const first = firstName.trim().charAt(0);
    const last = (lastName ?? firstName.trim().split(/\s+/).slice(1).join(' ')).trim().charAt(0);
    return `${first}${last}`.toUpperCase();
}

export type WorkerSummary = {
    id: string;
    name: string;
    initials: string;
    email: string;
    phone: string;
    status: string;
};

function toWorkerSummary(w: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: string;
}): WorkerSummary {
    return {
        id: w.id,
        name: `${w.firstName} ${w.lastName}`.trim(),
        initials: initialsOf(w.firstName, w.lastName),
        email: w.email,
        phone: w.phone,
        status: w.status,
    };
}

const WORKER_SELECT = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    status: true,
} as const;

/** Batch-loads workers by id into a lookup keyed by Worker.id. */
async function workerMap(ids: (string | null | undefined)[]): Promise<Map<string, WorkerSummary>> {
    const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
    if (unique.length === 0) return new Map();
    const workers = await prisma.worker.findMany({
        where: { id: { in: unique } },
        select: WORKER_SELECT,
    });
    return new Map(workers.map((w) => [w.id, toWorkerSummary(w)]));
}

// --- Clusters ---------------------------------------------------------------

export type ClusterOverview = {
    id: string;
    name: string;
    barangays: string[];
    mapLat: number | null;
    mapLng: number | null;
    clusterHead: WorkerSummary | null;
    coordinator: WorkerSummary | null;
    totalGroups: number;
    totalMentors: number;
    totalPotentialMentees: number;
    totalActiveMentees: number;
    communityBased: number;
    churchBased: number;
};

/** Every cluster with its rolled-up counts — the ministry head's top-level view. */
export async function listClusterOverviews(): Promise<ClusterOverview[]> {
    const clusters = await prisma.c2SCluster.findMany({
        include: {
            groups: { select: { id: true, groupType: true, mentorId: true } },
            coordinators: { where: { status: 'Active' }, select: { workerId: true } },
            mentors: { where: { status: 'Active' }, select: { workerId: true } },
        },
        orderBy: { name: 'asc' },
    });

    const groupIds = clusters.flatMap((c) => c.groups.map((g) => g.id));
    const [activeCounts, pipelineCounts, workers] = await Promise.all([
        prisma.c2SMentee.groupBy({
            by: ['groupId'],
            where: { groupId: { in: groupIds }, inactiveAt: null },
            _count: { _all: true },
        }),
        prisma.c2SJoinRequest.groupBy({
            by: ['groupId'],
            where: { groupId: { in: groupIds }, pipelineStatus: { not: 'Accepted' } },
            _count: { _all: true },
        }),
        workerMap([
            ...clusters.map((c) => c.clusterHeadId),
            ...clusters.flatMap((c) => c.coordinators.map((x) => x.workerId)),
        ]),
    ]);

    const activeByGroup = new Map(activeCounts.map((r) => [r.groupId, r._count._all]));
    const pipelineByGroup = new Map(pipelineCounts.map((r) => [r.groupId, r._count._all]));

    return clusters.map((cluster) => {
        const sum = (m: Map<string, number>) =>
            cluster.groups.reduce((total, g) => total + (m.get(g.id) ?? 0), 0);
        return {
            id: cluster.id,
            name: cluster.name,
            barangays: cluster.barangays,
            mapLat: cluster.mapLat,
            mapLng: cluster.mapLng,
            clusterHead: cluster.clusterHeadId ? workers.get(cluster.clusterHeadId) ?? null : null,
            coordinator: cluster.coordinators[0]
                ? workers.get(cluster.coordinators[0].workerId) ?? null
                : null,
            totalGroups: cluster.groups.length,
            totalMentors: cluster.mentors.length,
            totalPotentialMentees: sum(pipelineByGroup),
            totalActiveMentees: sum(activeByGroup),
            communityBased: cluster.groups.filter((g) => g.groupType === 'Community-based').length,
            churchBased: cluster.groups.filter((g) => g.groupType === 'Church-based').length,
        };
    });
}

/** The cluster `workerId` heads, if any. */
export async function getClusterForHead(workerId: string) {
    return prisma.c2SCluster.findFirst({ where: { clusterHeadId: workerId } });
}

/** The clusters `workerId` coordinates. */
export async function getClustersForCoordinator(workerId: string) {
    const assignments = await prisma.c2SCoordinatorAssignment.findMany({
        where: { workerId, status: 'Active' },
        include: { cluster: true },
    });
    return assignments.map((a) => a.cluster);
}

export type ClusterInput = {
    name: string;
    barangays?: string[];
    mapLat?: number | null;
    mapLng?: number | null;
    clusterHeadId?: string | null;
};

export async function createCluster(data: ClusterInput) {
    return prisma.c2SCluster.create({
        data: {
            name: data.name,
            barangays: data.barangays ?? [],
            mapLat: data.mapLat ?? null,
            mapLng: data.mapLng ?? null,
            clusterHeadId: data.clusterHeadId ?? null,
        },
    });
}

export async function updateCluster(id: string, data: Partial<ClusterInput>) {
    return prisma.c2SCluster.update({ where: { id }, data });
}

export async function deleteCluster(id: string) {
    await prisma.c2SCluster.delete({ where: { id } });
}

// --- Coordinators -----------------------------------------------------------

export type CoordinatorSummary = WorkerSummary & {
    assignmentId: string;
    clusterId: string;
    clusterName: string;
    barangays: string[];
    assignedPotential: number;
    pendingAssignments: number;
    activeMentors: number;
};

/** Coordinators for `clusterId`, or across every cluster when omitted. */
export async function listCoordinators(clusterId?: string): Promise<CoordinatorSummary[]> {
    const assignments = await prisma.c2SCoordinatorAssignment.findMany({
        where: { ...(clusterId ? { clusterId } : {}), status: 'Active' },
        include: { cluster: { include: { mentors: { where: { status: 'Active' } } } } },
    });

    const [workers, assignedCounts, pendingCounts] = await Promise.all([
        workerMap(assignments.map((a) => a.workerId)),
        prisma.c2SJoinRequest.groupBy({
            by: ['assignedCoordinatorId'],
            where: { assignedCoordinatorId: { in: assignments.map((a) => a.workerId) } },
            _count: { _all: true },
        }),
        prisma.c2SJoinRequest.groupBy({
            by: ['assignedCoordinatorId'],
            where: {
                assignedCoordinatorId: { in: assignments.map((a) => a.workerId) },
                pipelineStatus: { in: ['New', 'Waiting for Assignment'] },
            },
            _count: { _all: true },
        }),
    ]);

    const assignedBy = new Map(assignedCounts.map((r) => [r.assignedCoordinatorId, r._count._all]));
    const pendingBy = new Map(pendingCounts.map((r) => [r.assignedCoordinatorId, r._count._all]));

    return assignments.flatMap((a) => {
        const worker = workers.get(a.workerId);
        if (!worker) return [];
        return [{
            ...worker,
            assignmentId: a.id,
            clusterId: a.clusterId,
            clusterName: a.cluster.name,
            barangays: a.barangays,
            assignedPotential: assignedBy.get(a.workerId) ?? 0,
            pendingAssignments: pendingBy.get(a.workerId) ?? 0,
            activeMentors: a.cluster.mentors.length,
        }];
    });
}

export async function assignCoordinator(input: {
    workerId: string;
    clusterId: string;
    barangays?: string[];
}) {
    return prisma.c2SCoordinatorAssignment.upsert({
        where: { workerId_clusterId: { workerId: input.workerId, clusterId: input.clusterId } },
        create: {
            workerId: input.workerId,
            clusterId: input.clusterId,
            barangays: input.barangays ?? [],
        },
        update: { barangays: input.barangays ?? [], status: 'Active' },
    });
}

export async function removeCoordinator(assignmentId: string) {
    await prisma.c2SCoordinatorAssignment.delete({ where: { id: assignmentId } });
}

// --- Mentors ----------------------------------------------------------------

export type MentorSummary = WorkerSummary & {
    assignmentId: string;
    clusterId: string;
    clusterName: string;
    groupCapacity: number;
    dateAssigned: Date;
    numberOfGroups: number;
    activeMentees: number;
    availableSlots: number;
    /** % of session attendance records marked present, 0 when no sessions yet. */
    attendance: number;
    /** Mean `progress` across the mentor's active mentees. */
    completion: number;
    /** % of active mentees with a devotional entry in the last 7 days. */
    devotion: number;
    groups: {
        id: string;
        name: string;
        barangay: string | null;
        location: string | null;
        meetingSchedule: string | null;
        mentees: number;
    }[];
};

/** Mentors for `clusterId`, or across every cluster when omitted, with their engagement metrics. */
export async function listMentors(clusterId?: string): Promise<MentorSummary[]> {
    const assignments = await prisma.c2SMentorAssignment.findMany({
        where: { ...(clusterId ? { clusterId } : {}), status: 'Active' },
        include: { cluster: true },
    });
    const workerIds = assignments.map((a) => a.workerId);
    if (workerIds.length === 0) return [];

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [workers, groups, mentees, attendance, recentDevotions] = await Promise.all([
        workerMap(workerIds),
        prisma.c2SGroup.findMany({
            where: { mentorId: { in: workerIds } },
            select: {
                id: true,
                name: true,
                barangay: true,
                location: true,
                meetingSchedule: true,
                mentorId: true,
            },
        }),
        prisma.c2SMentee.findMany({
            where: { mentorId: { in: workerIds }, inactiveAt: null },
            select: { id: true, mentorId: true, groupId: true, progress: true },
        }),
        prisma.c2SAttendanceRecord.findMany({
            where: { session: { group: { mentorId: { in: workerIds } } } },
            select: { present: true, menteeId: true },
        }),
        prisma.c2SDevotionEntry.findMany({
            where: { date: { gte: weekAgo }, completed: true },
            select: { menteeId: true },
            distinct: ['menteeId'],
        }),
    ]);

    const devotedMentees = new Set(recentDevotions.map((d) => d.menteeId));
    const menteeMentor = new Map(mentees.map((m) => [m.id, m.mentorId]));

    const attendanceByMentor = new Map<string, { present: number; total: number }>();
    for (const record of attendance) {
        const mentorId = menteeMentor.get(record.menteeId);
        if (!mentorId) continue;
        const bucket = attendanceByMentor.get(mentorId) ?? { present: 0, total: 0 };
        bucket.total += 1;
        if (record.present) bucket.present += 1;
        attendanceByMentor.set(mentorId, bucket);
    }

    const pct = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 100));

    return assignments.flatMap((a) => {
        const worker = workers.get(a.workerId);
        if (!worker) return [];

        const mentorGroups = groups.filter((g) => g.mentorId === a.workerId);
        const mentorMentees = mentees.filter((m) => m.mentorId === a.workerId);
        const att = attendanceByMentor.get(a.workerId) ?? { present: 0, total: 0 };

        return [{
            ...worker,
            assignmentId: a.id,
            clusterId: a.clusterId,
            clusterName: a.cluster.name,
            groupCapacity: a.groupCapacity,
            dateAssigned: a.dateAssigned,
            numberOfGroups: mentorGroups.length,
            activeMentees: mentorMentees.length,
            availableSlots: Math.max(0, a.groupCapacity - mentorMentees.length),
            attendance: pct(att.present, att.total),
            completion: mentorMentees.length === 0
                ? 0
                : Math.round(mentorMentees.reduce((s, m) => s + m.progress, 0) / mentorMentees.length),
            devotion: pct(mentorMentees.filter((m) => devotedMentees.has(m.id)).length, mentorMentees.length),
            groups: mentorGroups.map((g) => ({
                id: g.id,
                name: g.name,
                barangay: g.barangay,
                location: g.location,
                meetingSchedule: g.meetingSchedule,
                mentees: mentorMentees.filter((m) => m.groupId === g.id).length,
            })),
        }];
    });
}

export async function assignMentor(input: {
    workerId: string;
    clusterId: string;
    groupCapacity?: number;
}) {
    return prisma.c2SMentorAssignment.upsert({
        where: { workerId_clusterId: { workerId: input.workerId, clusterId: input.clusterId } },
        create: {
            workerId: input.workerId,
            clusterId: input.clusterId,
            groupCapacity: input.groupCapacity ?? 12,
        },
        update: { groupCapacity: input.groupCapacity ?? 12, status: 'Active' },
    });
}

export async function removeMentor(assignmentId: string) {
    await prisma.c2SMentorAssignment.delete({ where: { id: assignmentId } });
}

// --- Potential-mentee pipeline ----------------------------------------------

export const PIPELINE_STATUSES = [
    'New',
    'Waiting for Assignment',
    'Assigned to Mentor',
    'Interview Scheduled',
    'Interview Completed',
    'Accepted',
] as const;

export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];

export type PipelineEntry = {
    id: string;
    name: string;
    initials: string;
    email: string;
    phone: string | null;
    gender: string | null;
    birthday: Date | null;
    age: number | null;
    barangay: string | null;
    socialMediaLink: string | null;
    firstAttended: string | null;
    source: string;
    status: PipelineStatus;
    groupId: string;
    groupName: string;
    groupType: string | null;
    preferredGroupNames: string[];
    clusterId: string | null;
    clusterName: string | null;
    assignedCoordinator: WorkerSummary | null;
    assignedMentor: WorkerSummary | null;
    interviewDate: Date | null;
    notes: string | null;
    dateSubmitted: Date;
};

function ageFrom(birthday: Date | null): number | null {
    if (!birthday) return null;
    const diff = Date.now() - birthday.getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

type PipelineScope = {
    /** Restrict to requests whose group sits in one of these clusters. */
    clusterIds?: string[];
    /** Restrict to requests assigned to this coordinator. */
    coordinatorId?: string;
    /** Restrict to requests assigned to this mentor. */
    mentorId?: string;
    /** Include requests that already became mentees. Defaults to false. */
    includeAccepted?: boolean;
};

/** The potential-mentee pipeline, scoped to whichever role is asking. */
export async function listPipeline(scope: PipelineScope = {}): Promise<PipelineEntry[]> {
    const requests = await prisma.c2SJoinRequest.findMany({
        where: {
            ...(scope.clusterIds ? { group: { clusterId: { in: scope.clusterIds } } } : {}),
            ...(scope.coordinatorId ? { assignedCoordinatorId: scope.coordinatorId } : {}),
            ...(scope.mentorId ? { assignedMentorId: scope.mentorId } : {}),
            ...(scope.includeAccepted ? {} : { pipelineStatus: { not: 'Accepted' } }),
        },
        include: { group: { include: { cluster: { select: { id: true, name: true } } } } },
        orderBy: { createdAt: 'desc' },
    });

    const preferredIds = [...new Set(requests.flatMap((r) => r.preferredGroupIds))];
    const [workers, preferredGroups] = await Promise.all([
        workerMap(requests.flatMap((r) => [r.assignedCoordinatorId, r.assignedMentorId])),
        preferredIds.length
            ? prisma.c2SGroup.findMany({ where: { id: { in: preferredIds } }, select: { id: true, name: true } })
            : Promise.resolve([]),
    ]);
    const preferredNames = new Map(preferredGroups.map((g) => [g.id, g.name]));

    return requests.map((r) => ({
        id: r.id,
        name: `${r.firstName} ${r.lastName}`.trim(),
        initials: initialsOf(r.firstName, r.lastName),
        email: r.email,
        phone: r.phone,
        gender: r.gender,
        birthday: r.birthday,
        age: ageFrom(r.birthday),
        barangay: r.barangay,
        socialMediaLink: r.socialMediaLink,
        firstAttended: r.firstAttendedMonth && r.firstAttendedYear
            ? `${r.firstAttendedMonth} ${r.firstAttendedYear}`
            : null,
        source: r.source,
        status: r.pipelineStatus as PipelineStatus,
        groupId: r.groupId,
        groupName: r.group.name,
        groupType: r.groupType ?? r.group.groupType,
        preferredGroupNames: r.preferredGroupIds.flatMap((id) => {
            const name = preferredNames.get(id);
            return name ? [name] : [];
        }),
        clusterId: r.group.cluster?.id ?? null,
        clusterName: r.group.cluster?.name ?? null,
        assignedCoordinator: r.assignedCoordinatorId ? workers.get(r.assignedCoordinatorId) ?? null : null,
        assignedMentor: r.assignedMentorId ? workers.get(r.assignedMentorId) ?? null : null,
        interviewDate: r.interviewDate,
        notes: r.notes ?? r.message,
        dateSubmitted: r.createdAt,
    }));
}

/** Routes a pending request to a coordinator — moves it to "Waiting for Assignment". */
export async function assignPipelineCoordinator(requestId: string, coordinatorId: string) {
    return prisma.c2SJoinRequest.update({
        where: { id: requestId },
        data: { assignedCoordinatorId: coordinatorId, pipelineStatus: 'Waiting for Assignment' },
    });
}

/** Routes a request to a mentor — moves it to "Assigned to Mentor". */
export async function assignPipelineMentor(requestId: string, mentorId: string) {
    return prisma.c2SJoinRequest.update({
        where: { id: requestId },
        data: { assignedMentorId: mentorId, pipelineStatus: 'Assigned to Mentor' },
    });
}

export async function schedulePipelineInterview(requestId: string, interviewDate: Date) {
    return prisma.c2SJoinRequest.update({
        where: { id: requestId },
        data: { interviewDate, pipelineStatus: 'Interview Scheduled' },
    });
}

export async function updatePipelineStatus(requestId: string, status: PipelineStatus) {
    return prisma.c2SJoinRequest.update({
        where: { id: requestId },
        data: { pipelineStatus: status },
    });
}

export async function updatePipelineNotes(requestId: string, notes: string) {
    return prisma.c2SJoinRequest.update({ where: { id: requestId }, data: { notes } });
}

/**
 * Recommends someone into the pipeline directly (not via the public finder) —
 * the "Recommend a group" flow on the mentor and coordinator dashboards.
 */
export async function createRecommendedPipelineEntry(input: {
    groupId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    barangay?: string;
    gender?: string;
    birthday?: Date;
    preferredGroupIds?: string[];
    notes?: string;
    recommendedById: string;
}) {
    return prisma.c2SJoinRequest.create({
        data: {
            groupId: input.groupId,
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            phone: input.phone ?? null,
            barangay: input.barangay ?? null,
            gender: input.gender ?? null,
            birthday: input.birthday ?? null,
            preferredGroupIds: input.preferredGroupIds ?? [],
            notes: input.notes ?? null,
            source: 'Recommended',
            pipelineStatus: 'New',
            privacyAccepted: true,
            assignedCoordinatorId: input.recommendedById,
        },
    });
}

// --- Mentee rosters ---------------------------------------------------------

const MENTEE_INCLUDE = {
    trainings: true,
    group: { select: { id: true, name: true } },
} as const;

/** Mentees of `workerId`'s groups. Active only unless `includeInactive`. */
export async function listMenteesForMentor(workerId: string, includeInactive = false) {
    return prisma.c2SMentee.findMany({
        where: { mentorId: workerId, ...(includeInactive ? {} : { inactiveAt: null }) },
        include: MENTEE_INCLUDE,
        orderBy: { createdAt: 'desc' },
    });
}

/** Every mentee in the given clusters. Active only unless `includeInactive`. */
export async function listMenteesForClusters(clusterIds: string[], includeInactive = false) {
    if (clusterIds.length === 0) return [];
    return prisma.c2SMentee.findMany({
        where: {
            group: { clusterId: { in: clusterIds } },
            ...(includeInactive ? {} : { inactiveAt: null }),
        },
        include: MENTEE_INCLUDE,
        orderBy: { createdAt: 'desc' },
    });
}

/** Every mentee across every group — the ministry head's roster. */
export async function listAllMentees(includeInactive = false) {
    return prisma.c2SMentee.findMany({
        where: includeInactive ? {} : { inactiveAt: null },
        include: MENTEE_INCLUDE,
        orderBy: { createdAt: 'desc' },
    });
}

/** Members of a single group. */
export async function listGroupMembers(groupId: string) {
    return prisma.c2SMentee.findMany({
        where: { groupId },
        include: MENTEE_INCLUDE,
        orderBy: { firstName: 'asc' },
    });
}

// --- Activity feed ----------------------------------------------------------

export type ActivityItem = {
    id: string;
    type: 'new_potential' | 'assignment' | 'interview' | 'accepted';
    text: string;
    at: Date;
};

/**
 * Recent pipeline activity for the dashboard notification panels, derived from
 * the join requests themselves rather than a separate feed table.
 */
export async function listRecentActivity(
    scope: { clusterIds?: string[]; coordinatorId?: string } = {},
    limit = 20,
): Promise<ActivityItem[]> {
    const requests = await prisma.c2SJoinRequest.findMany({
        where: {
            ...(scope.clusterIds ? { group: { clusterId: { in: scope.clusterIds } } } : {}),
            ...(scope.coordinatorId ? { assignedCoordinatorId: scope.coordinatorId } : {}),
        },
        include: { group: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });

    const mentorIds = requests.flatMap((r) => (r.assignedMentorId ? [r.assignedMentorId] : []));
    const mentors = await workerMap(mentorIds);

    return requests.map((r) => {
        const name = `${r.firstName} ${r.lastName}`.trim();
        const mentor = r.assignedMentorId ? mentors.get(r.assignedMentorId)?.name : null;

        if (r.pipelineStatus === 'Accepted') {
            return { id: r.id, type: 'accepted' as const, text: `${name} was accepted into ${r.group.name}`, at: r.createdAt };
        }
        if (r.pipelineStatus === 'Interview Scheduled' || r.pipelineStatus === 'Interview Completed') {
            return { id: r.id, type: 'interview' as const, text: `${r.pipelineStatus} for ${name}`, at: r.createdAt };
        }
        if (mentor) {
            return { id: r.id, type: 'assignment' as const, text: `${name} has been assigned to ${mentor}`, at: r.createdAt };
        }
        return {
            id: r.id,
            type: 'new_potential' as const,
            text: `New potential mentee ${name} submitted a request${r.source === 'Recommended' ? ' (recommended)' : ' from C2S Group Finder'}`,
            at: r.createdAt,
        };
    });
}

// --- Devotional progress ----------------------------------------------------

export async function getDevotionEntries(menteeId: string, since?: Date) {
    return prisma.c2SDevotionEntry.findMany({
        where: { menteeId, ...(since ? { date: { gte: since } } : {}) },
        orderBy: { date: 'desc' },
    });
}

export async function logDevotionEntry(input: {
    menteeId: string;
    date: Date;
    module?: string | null;
    lesson?: string | null;
    completed?: boolean;
    notes?: string | null;
}) {
    return prisma.c2SDevotionEntry.upsert({
        where: { menteeId_date: { menteeId: input.menteeId, date: input.date } },
        create: {
            menteeId: input.menteeId,
            date: input.date,
            module: input.module ?? null,
            lesson: input.lesson ?? null,
            completed: input.completed ?? true,
            notes: input.notes ?? null,
        },
        update: {
            module: input.module ?? null,
            lesson: input.lesson ?? null,
            completed: input.completed ?? true,
            notes: input.notes ?? null,
        },
    });
}

/** Consecutive days ending today (or yesterday) with a completed entry. */
export function devotionStreak(entries: { date: Date; completed: boolean }[]): number {
    const days = new Set(
        entries.filter((e) => e.completed).map((e) => e.date.toISOString().slice(0, 10)),
    );
    const cursor = new Date();
    cursor.setUTCHours(0, 0, 0, 0);
    if (!days.has(cursor.toISOString().slice(0, 10))) {
        cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    let streak = 0;
    while (days.has(cursor.toISOString().slice(0, 10))) {
        streak += 1;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    return streak;
}

// --- Trainings and endorsements ---------------------------------------------

export async function addTraining(menteeId: string, label: string, year: string) {
    return prisma.c2STraining.create({ data: { menteeId, label, year } });
}

export async function removeTraining(trainingId: string) {
    await prisma.c2STraining.delete({ where: { id: trainingId } });
}

/** Flags a mentee as endorsed to become a worker. */
export async function endorseMentee(menteeId: string, endorsedById: string) {
    return prisma.c2SMentee.update({
        where: { id: menteeId },
        data: { endorsedAt: new Date(), endorsedById },
    });
}

/** Mentees endorsed by `workerId`, for the "endorsed workers" panel. */
export async function listEndorsedMentees(workerId?: string) {
    return prisma.c2SMentee.findMany({
        where: { endorsedAt: { not: null }, ...(workerId ? { endorsedById: workerId } : {}) },
        include: { group: { select: { id: true, name: true } }, trainings: true },
        orderBy: { endorsedAt: 'desc' },
    });
}

/** Moves a mentee out of the active roster while keeping the record. */
export async function deactivateMentee(menteeId: string, reason: string) {
    return prisma.c2SMentee.update({
        where: { id: menteeId },
        data: { inactiveAt: new Date(), inactiveReason: reason },
    });
}

/** Moves a mentee to another group, reassigning them to that group's mentor. */
export async function transferMentee(menteeId: string, toGroupId: string) {
    const group = await prisma.c2SGroup.findUniqueOrThrow({
        where: { id: toGroupId },
        select: { mentorId: true },
    });
    return prisma.c2SMentee.update({
        where: { id: menteeId },
        data: { groupId: toGroupId, mentorId: group.mentorId },
    });
}
