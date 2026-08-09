import 'server-only';
import * as C2S from '@studio/c2s';
import type { User } from './session-user';
import {
    toC2SGroup,
    toClusterMentor,
    toClusterPotentialMentee,
    toC2SCoordinator,
    toCoordGroup,
    toCoordMentor,
    toCoordPotentialMentee,
    toEndorsedGroup,
    toEndorsedWorker,
    toGroupMember,
    toInactiveMentee,
    toMentee,
    toMHCoordinator,
    toMHMentor,
    toMHPotentialMentee,
    toMHActiveMentee,
    toNotification,
    toOutreachCluster,
    toPotentialMentee,
    type MenteeRow,
    type PublicGroupRow,
} from './adapters';
import type {
    C2SCoordinator,
    C2SGroup,
    ClusterGroupPin,
    ClusterMentor,
    ClusterPotentialMentee,
    CoordGroup,
    CoordMentor,
    CoordPotentialMentee,
    DashboardNotification,
    EndorsedGroup,
    EndorsedWorker,
    GroupMember,
    InactiveMentee,
    Mentee,
    MHActiveMentee,
    MHCoordinator,
    MHMentor,
    MHPotentialMentee,
    OutreachCluster,
    PotentialMentee,
} from './data';

/**
 * Server-side data loading for the four role dashboards. Each loader reads
 * through `@studio/c2s` (which sits on core-engine + Prisma) and hands the
 * result back already shaped as the view types in `./data`.
 */

export type MentorDashboardData = {
    groups: C2SGroup[];
    potentialMentees: PotentialMentee[];
    activeMentees: Mentee[];
    inactiveMentees: InactiveMentee[];
    groupMembers: Record<string, GroupMember[]>;
    endorsedGroups: EndorsedGroup[];
    endorsedWorkers: EndorsedWorker[];
};

export type ClusterHeadDashboardData = {
    coordinators: C2SCoordinator[];
    mentors: ClusterMentor[];
    potentialMentees: ClusterPotentialMentee[];
    activeMentees: Mentee[];
    inactiveMentees: InactiveMentee[];
    clusterGroups: ClusterGroupPin[];
    notifications: DashboardNotification[];
};

export type CoordinatorDashboardData = {
    potentialMentees: CoordPotentialMentee[];
    mentors: CoordMentor[];
    groups: CoordGroup[];
    notifications: DashboardNotification[];
};

export type MinistryHeadDashboardData = {
    clusters: OutreachCluster[];
    coordinators: MHCoordinator[];
    mentors: MHMentor[];
    potentialMentees: MHPotentialMentee[];
    activeMentees: MHActiveMentee[];
    notifications: DashboardNotification[];
};

export type DashboardData =
    | ({ role: 'mentor' } & MentorDashboardData)
    | ({ role: 'cluster_head' } & ClusterHeadDashboardData)
    | ({ role: 'c2s_coordinator' } & CoordinatorDashboardData)
    | ({ role: 'ministry_head' } & MinistryHeadDashboardData);

/** The public group directory, adapted for the finder pages and group pickers. */
export async function loadPublicGroups(): Promise<C2SGroup[]> {
    const rows = (await C2S.listPublicC2SGroups()) as unknown as PublicGroupRow[];
    return rows.map(toC2SGroup);
}

async function loadGroupRows(): Promise<PublicGroupRow[]> {
    return (await C2S.listPublicC2SGroups()) as unknown as PublicGroupRow[];
}

// --- Mentor -----------------------------------------------------------------

async function loadMentorDashboard(user: User): Promise<MentorDashboardData> {
    const [groups, mentees, inactive, pipeline, endorsed] = await Promise.all([
        C2S.getMentorGroups(user.id),
        C2S.listMenteesForMentor(user.id),
        C2S.listMenteesForMentor(user.id, true),
        C2S.listPipeline({ mentorId: user.id }),
        C2S.listEndorsedMentees(user.id),
    ]);

    const groupRows = (await loadGroupRows()).filter((g) => groups.some((mg) => mg.id === g.id));
    const menteeRows = mentees as unknown as MenteeRow[];

    const groupMembers: Record<string, GroupMember[]> = {};
    for (const group of groups) {
        groupMembers[group.name] = menteeRows
            .filter((m) => m.groupId === group.id)
            .map(toGroupMember);
    }

    const avgProgress = (groupId: string) => {
        const members = menteeRows.filter((m) => m.groupId === groupId);
        if (members.length === 0) return 0;
        return Math.round(members.reduce((s, m) => s + m.progress, 0) / members.length);
    };

    return {
        groups: groupRows.map(toC2SGroup),
        potentialMentees: pipeline.map(toPotentialMentee),
        activeMentees: menteeRows.map(toMentee),
        inactiveMentees: (inactive as unknown as MenteeRow[])
            .filter((m) => m.inactiveAt)
            .map(toInactiveMentee),
        groupMembers,
        endorsedGroups: groupRows.map((g) => toEndorsedGroup(g, avgProgress(g.id))),
        endorsedWorkers: (endorsed as unknown as MenteeRow[]).map(toEndorsedWorker),
    };
}

// --- Cluster head -----------------------------------------------------------

async function loadClusterHeadDashboard(user: User): Promise<ClusterHeadDashboardData> {
    const clusterIds = user.clusterId ? [user.clusterId] : [];

    const [coordinators, mentors, pipeline, mentees, allMentees, activity, groupRows] =
        await Promise.all([
            C2S.listCoordinators(user.clusterId),
            C2S.listMentors(user.clusterId),
            C2S.listPipeline({ clusterIds }),
            C2S.listMenteesForClusters(clusterIds),
            C2S.listMenteesForClusters(clusterIds, true),
            C2S.listRecentActivity({ clusterIds }),
            loadGroupRows(),
        ]);

    const menteeRows = mentees as unknown as MenteeRow[];
    const clusterGroupRows = groupRows.filter((g) => g.clusterId === user.clusterId);

    return {
        coordinators: coordinators.map((c) =>
            toC2SCoordinator(c, activity.filter((a) => a.type === 'assignment').slice(0, 3)),
        ),
        mentors: mentors.map((m) =>
            toClusterMentor(m, menteeRows.filter((row) => row.mentorId === m.id)),
        ),
        potentialMentees: pipeline.map(toClusterPotentialMentee),
        activeMentees: menteeRows.map(toMentee),
        inactiveMentees: (allMentees as unknown as MenteeRow[])
            .filter((m) => m.inactiveAt)
            .map(toInactiveMentee),
        clusterGroups: clusterGroupRows.map((g) => {
            const mentor = mentors.find((m) => m.groups.some((mg) => mg.id === g.id));
            return {
                id: g.id,
                name: g.name,
                type: g.groupType === 'Church-based' ? 'Church-based' : 'Community-based',
                barangay: g.barangay ?? '',
                mentor: mentor?.name ?? g.leaderName ?? '—',
                members: g._count.mentees,
                lat: g.mapLat ?? 14.3294,
                lng: g.mapLng ?? 120.9367,
            } satisfies ClusterGroupPin;
        }),
        notifications: activity.map(toNotification),
    };
}

// --- Coordinator ------------------------------------------------------------

async function loadCoordinatorDashboard(user: User): Promise<CoordinatorDashboardData> {
    const clusters = await C2S.getClustersForCoordinator(user.id);
    const clusterIds = clusters.map((c) => c.id);

    const [pipeline, mentors, activity, groupRows] = await Promise.all([
        C2S.listPipeline({ clusterIds }),
        C2S.listMentors(clusterIds[0]),
        C2S.listRecentActivity({ coordinatorId: user.id }),
        loadGroupRows(),
    ]);

    const clusterGroups = groupRows.filter((g) => g.clusterId && clusterIds.includes(g.clusterId));
    const mentorName = (groupId: string) =>
        mentors.find((m) => m.groups.some((g) => g.id === groupId))?.name ?? '—';

    return {
        potentialMentees: pipeline.map(toCoordPotentialMentee),
        mentors: mentors.map(toCoordMentor),
        groups: clusterGroups.map((g) => toCoordGroup(g, mentorName(g.id))),
        notifications: activity.map(toNotification),
    };
}

// --- Ministry head ----------------------------------------------------------

async function loadMinistryHeadDashboard(): Promise<MinistryHeadDashboardData> {
    const [clusters, coordinators, mentors, pipeline, mentees, activity] = await Promise.all([
        C2S.listClusterOverviews(),
        C2S.listCoordinators(),
        C2S.listMentors(),
        C2S.listPipeline({}),
        C2S.listAllMentees(),
        C2S.listRecentActivity({}),
    ]);

    const mentorById = new Map(mentors.map((m) => [m.id, m]));

    return {
        clusters: clusters.map(toOutreachCluster),
        coordinators: coordinators.map(toMHCoordinator),
        mentors: mentors.map(toMHMentor),
        potentialMentees: pipeline.map(toMHPotentialMentee),
        activeMentees: (mentees as unknown as MenteeRow[]).map((m) => {
            const mentor = mentorById.get(m.mentorId);
            const cluster = mentor?.clusterName ?? '—';
            const coordinator =
                coordinators.find((c) => c.clusterId === mentor?.clusterId)?.name ?? '—';
            return toMHActiveMentee(m, cluster, coordinator, mentor?.name ?? '—');
        }),
        notifications: activity.map(toNotification),
    };
}

/** Loads whichever dataset `user`'s role needs. */
export async function loadDashboardData(user: User): Promise<DashboardData> {
    switch (user.role) {
        case 'mentor':
            return { role: 'mentor', ...(await loadMentorDashboard(user)) };
        case 'cluster_head':
            return { role: 'cluster_head', ...(await loadClusterHeadDashboard(user)) };
        case 'c2s_coordinator':
            return { role: 'c2s_coordinator', ...(await loadCoordinatorDashboard(user)) };
        case 'ministry_head':
            return { role: 'ministry_head', ...(await loadMinistryHeadDashboard()) };
    }
}
