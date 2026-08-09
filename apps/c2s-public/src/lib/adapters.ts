/**
 * Maps rows coming out of `@studio/c2s` onto the view types the C2S components
 * were written against. Keeping the translation here means the dashboards stay
 * presentational and the database schema can move independently of them.
 */

import type {
    ClusterOverview,
    CoordinatorSummary,
    MentorSummary,
    PipelineEntry,
    ActivityItem,
    ChurchWideStats,
} from '@studio/c2s';
import type { DashboardData as SharedDashboardData } from '@/components/DashboardSharedWidgets';
import {
    tagColor,
    type C2SGroup,
    type C2SCoordinator,
    type ClusterMentor,
    type ClusterPotentialMentee,
    type CoordGroup,
    type CoordMentor,
    type CoordPotentialMentee,
    type DashboardNotification,
    type EndorsedGroup,
    type EndorsedWorker,
    type GroupMember,
    type InactiveMentee,
    type Mentee,
    type MHActiveMentee,
    type MHCoordinator,
    type MHMentor,
    type MHPotentialMentee,
    type OutreachCluster,
    type PotentialMentee,
} from './data';

// --- Small shared helpers ---------------------------------------------------

const AVATAR_COLORS = ['#0b9b8a', '#e91e8c', '#1971c2', '#6741d9', '#e67700', '#0c8a6e', '#5b50d6'];

/** Deterministic avatar colour so a person keeps the same chip across renders. */
export function avatarColor(seed: string): string {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

const DATE_OPTS: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };

export function formatDate(date: Date | string | null | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-PH', DATE_OPTS);
}

/** "2 hrs ago" / "Yesterday" / "3 days ago" for the activity feeds. */
export function relativeTime(date: Date | string): string {
    const then = new Date(date).getTime();
    const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
    if (minutes < 60) return minutes <= 1 ? 'Just now' : `${minutes} mins ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} ${hours === 1 ? 'hr' : 'hrs'} ago`;
    const days = Math.round(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
}

function ageRangeLabel(min: number | null, max: number | null): string {
    if (min != null && max != null) return `Ages ${min}-${max}`;
    if (min != null) return `Ages ${min}+`;
    if (max != null) return `Up to ${max}`;
    return 'All ages';
}

// --- Public group directory -------------------------------------------------

/** Row shape returned by `listPublicC2SGroups`. */
export type PublicGroupRow = {
    id: string;
    name: string;
    location: string | null;
    meetingSchedule: string | null;
    currentModule: string | null;
    ageGroupLabel: string | null;
    ageRangeMin: number | null;
    ageRangeMax: number | null;
    meetupDay: string | null;
    demographics: string[];
    mapLng: number | null;
    mapLat: number | null;
    createdAt: Date;
    description: string | null;
    barangay: string | null;
    leaderName: string | null;
    status: string;
    isFeatured: boolean;
    groupType: string;
    capacity: number;
    clusterId: string | null;
    _count: { mentees: number };
};

// Dasmariñas City centre — groups without coordinates still get a pin.
const DEFAULT_LAT = 14.3294;
const DEFAULT_LNG = 120.9367;

export function toC2SGroup(row: PublicGroupRow): C2SGroup {
    return {
        id: row.id,
        name: row.name,
        description: row.description ?? '',
        tags: row.demographics.map((label) => ({ label, color: tagColor(label) })),
        ageGroup: (row.ageGroupLabel as C2SGroup['ageGroup']) ?? 'All',
        leader: row.leaderName ?? '',
        location: row.location ?? '',
        barangay: row.barangay ?? '',
        schedule: row.meetingSchedule ?? '',
        meetupDay: row.meetupDay ?? '',
        ageRange: ageRangeLabel(row.ageRangeMin, row.ageRangeMax),
        status: row.status === 'Open' ? 'Open' : 'Closed',
        lat: row.mapLat ?? DEFAULT_LAT,
        lng: row.mapLng ?? DEFAULT_LNG,
        isFeatured: row.isFeatured,
    };
}

export function toCoordGroup(row: PublicGroupRow, mentorName: string): CoordGroup {
    const members = row._count.mentees;
    return {
        id: row.id,
        name: row.name,
        mentor: mentorName,
        mentorInitials: initials(mentorName),
        mentorColor: avatarColor(mentorName),
        barangay: row.barangay ?? '',
        type: row.groupType === 'Church-based' ? 'Church-based' : 'Community-based',
        members,
        capacity: row.capacity,
        availableSlots: Math.max(0, row.capacity - members),
        status: row.status === 'Closed'
            ? 'Closed'
            : members >= row.capacity ? 'Full' : 'Open',
        schedule: row.meetingSchedule ?? '',
    };
}

// --- Mentees ----------------------------------------------------------------

/** Row shape for a mentee loaded with its trainings. */
export type MenteeRow = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: string;
    notes: string | null;
    groupId: string;
    mentorId: string;
    createdAt: Date;
    gender: string | null;
    birthday: Date | null;
    socialMediaLink: string | null;
    firstAttended: string | null;
    connectedSince: Date | null;
    currentModule: string | null;
    currentLesson: string | null;
    progress: number;
    mentorNotes: string | null;
    inactiveAt: Date | null;
    inactiveReason: string | null;
    endorsedAt: Date | null;
    trainings?: { id: string; label: string; year: string }[];
    group?: { id: string; name: string } | null;
};

function fullName(row: { firstName: string; lastName: string }): string {
    return `${row.firstName} ${row.lastName}`.trim();
}

function ageOf(birthday: Date | null): number {
    if (!birthday) return 0;
    return Math.floor((Date.now() - new Date(birthday).getTime()) / (365.25 * 24 * 3600 * 1000));
}

function trainingsOf(row: MenteeRow) {
    return (row.trainings ?? []).map((t) => ({ label: t.label, year: t.year }));
}

export function toGroupMember(row: MenteeRow): GroupMember {
    const name = fullName(row);
    return {
        id: row.id,
        initials: initials(name),
        name,
        currentModule: row.currentModule ?? '—',
        currentLesson: row.currentLesson ?? '—',
        progress: row.progress,
        status: row.inactiveAt
            ? 'Inactive'
            : row.status === 'Pending Review' ? 'Pending Review' : 'Active',
        email: row.email,
        phone: row.phone,
        birthday: formatDate(row.birthday),
        facebook: row.socialMediaLink ?? '',
        firstAttended: row.firstAttended ?? '',
        trainings: trainingsOf(row),
    };
}

export function toMentee(row: MenteeRow): Mentee {
    const name = fullName(row);
    return {
        id: row.id,
        initials: initials(name),
        name,
        assignedGroup: row.group?.name ?? '',
        connectedSince: formatDate(row.connectedSince ?? row.createdAt),
        module: row.currentModule ?? '—',
        lesson: row.currentLesson ?? '—',
        progress: row.progress,
        email: row.email,
        phone: row.phone,
        age: ageOf(row.birthday),
        birthday: formatDate(row.birthday),
        gender: row.gender ?? '',
        facebook: row.socialMediaLink ?? '',
        firstAttended: row.firstAttended ?? '',
        currentModule: row.currentModule ?? '—',
        currentLesson: row.currentLesson ?? '—',
        mentorNotes: row.mentorNotes ?? '',
        trainings: trainingsOf(row),
    };
}

export function toInactiveMentee(row: MenteeRow): InactiveMentee {
    const reason = row.inactiveReason;
    return {
        id: row.id,
        name: fullName(row),
        assignedGroup: row.group?.name ?? '',
        dateInactive: formatDate(row.inactiveAt),
        lastModule: row.currentModule ?? '—',
        reason: reason === 'Completed' || reason === 'Transferred' ? reason : 'Inactive',
    };
}

export function toEndorsedWorker(row: MenteeRow): EndorsedWorker {
    const base = toMentee(row);
    return {
        ...base,
        endorsedSince: formatDate(row.endorsedAt),
    };
}

export function toEndorsedGroup(row: PublicGroupRow, progress: number): EndorsedGroup {
    return {
        id: row.id,
        name: row.name,
        members: row._count.mentees,
        progress,
    };
}

export function toMHActiveMentee(row: MenteeRow, cluster: string, coordinator: string, mentor: string): MHActiveMentee {
    const name = fullName(row);
    return {
        id: row.id,
        initials: initials(name),
        name,
        cluster,
        coordinator,
        mentor,
        barangay: row.group?.name ?? '',
        module: row.currentModule ?? '—',
        progress: row.progress,
    };
}

// --- Potential-mentee pipeline ----------------------------------------------

const SOURCE_COLORS: Record<string, string> = {
    'From C2S Group Finder': 'bg-[#e0f7f5] text-[#0b9b8a]',
    Recommended: 'bg-[#ede9fe] text-[#6741d9]',
};

function pipelineStatusToMentorStatus(status: string): PotentialMentee['status'] {
    if (status === 'Accepted') return 'Accepted';
    if (status === 'New') return 'Pending';
    return 'Recommended';
}

export function toPotentialMentee(entry: PipelineEntry): PotentialMentee {
    return {
        id: entry.id,
        initials: entry.initials,
        name: entry.name,
        age: entry.age ?? 0,
        gender: entry.gender ?? '',
        phone: entry.phone ?? '',
        source: entry.source === 'Recommended' ? 'Recommended' : 'From C2S Group Finder',
        sourceColor: SOURCE_COLORS[entry.source] ?? SOURCE_COLORS['From C2S Group Finder'],
        requestedGroup: entry.groupName,
        notes: entry.notes ?? '',
        status: pipelineStatusToMentorStatus(entry.status),
        email: entry.email,
        birthday: formatDate(entry.birthday),
        facebook: entry.socialMediaLink ?? '',
        firstAttended: entry.firstAttended ?? '',
        progress: 0,
        currentModule: '—',
        currentLesson: '—',
        trainings: [],
    };
}

export function toClusterPotentialMentee(entry: PipelineEntry): ClusterPotentialMentee {
    return {
        ...toPotentialMentee(entry),
        clusterStatus: entry.status,
        assignedCoordinator: entry.assignedCoordinator?.name,
        interviewDate: entry.interviewDate ? formatDate(entry.interviewDate) : undefined,
    };
}

export function toCoordPotentialMentee(entry: PipelineEntry): CoordPotentialMentee {
    return {
        id: entry.id,
        initials: entry.initials,
        name: entry.name,
        age: entry.age ?? 0,
        gender: entry.gender ?? '',
        phone: entry.phone ?? '',
        email: entry.email,
        barangay: entry.barangay ?? '',
        preferredGroups: entry.preferredGroupNames.length > 0
            ? entry.preferredGroupNames.slice(0, 2)
            : [entry.groupName],
        groupType: entry.groupType === 'Church-based' ? 'Church-based' : 'Community-based',
        dateSubmitted: formatDate(entry.dateSubmitted),
        status: entry.status,
        assignedMentor: entry.assignedMentor?.name,
        notes: entry.notes ?? '',
        facebook: entry.socialMediaLink ?? '',
        birthday: formatDate(entry.birthday),
        firstAttended: entry.firstAttended ?? '',
        source: entry.source === 'Recommended' ? 'Recommended' : 'From C2S Group Finder',
    };
}

export function toMHPotentialMentee(entry: PipelineEntry): MHPotentialMentee {
    return {
        id: entry.id,
        initials: entry.initials,
        name: entry.name,
        age: entry.age ?? 0,
        gender: entry.gender ?? '',
        cluster: entry.clusterName ?? '—',
        coordinator: entry.assignedCoordinator?.name ?? '—',
        mentor: entry.assignedMentor?.name ?? '—',
        barangay: entry.barangay ?? '',
        status: entry.status,
        source: entry.source === 'Recommended' ? 'Recommended' : 'From C2S Group Finder',
        dateSubmitted: formatDate(entry.dateSubmitted),
    };
}

// --- Coordinators and mentors -----------------------------------------------

export function toC2SCoordinator(row: CoordinatorSummary, activities: ActivityItem[]): C2SCoordinator {
    return {
        id: row.id,
        initials: row.initials,
        name: row.name,
        color: avatarColor(row.id),
        barangay: row.barangays.join(', '),
        phone: row.phone,
        email: row.email,
        assignedPotential: row.assignedPotential,
        pendingAssignments: row.pendingAssignments,
        avgAssignmentDays: row.avgAssignmentDays,
        status: row.status === 'Active' ? 'Active' : 'Inactive',
        recentActivities: activities.map((a) => ({ text: a.text, time: relativeTime(a.at) })),
    };
}

export function toMHCoordinator(row: CoordinatorSummary): MHCoordinator {
    return {
        id: row.id,
        initials: row.initials,
        name: row.name,
        color: avatarColor(row.id),
        cluster: row.clusterName,
        assignedPotentialMentees: row.assignedPotential,
        activeMentors: row.activeMentors,
        status: row.status === 'Active' ? 'Active' : 'Inactive',
    };
}

export function toClusterMentor(row: MentorSummary, mentees: MenteeRow[]): ClusterMentor {
    return {
        id: row.id,
        initials: row.initials,
        name: row.name,
        color: avatarColor(row.id),
        group: row.groups[0]?.name ?? '—',
        barangay: row.groups[0]?.barangay ?? '',
        phone: row.phone,
        email: row.email,
        numberOfGroups: row.numberOfGroups,
        activeMentees: row.activeMentees,
        groupCapacity: row.groupCapacity,
        attendance: row.attendance,
        completion: row.completion,
        devotion: row.devotion,
        status: row.status === 'Active' ? 'Active' : 'Inactive',
        groups: row.groups.map((g) => ({
            name: g.name,
            barangay: g.barangay ?? '',
            mentees: g.mentees,
            schedule: g.meetingSchedule ?? undefined,
            address: g.location ?? undefined,
        })),
        mentees: mentees.map((m) => {
            const name = fullName(m);
            const group = row.groups.find((g) => g.id === m.groupId);
            return {
                id: m.id,
                initials: initials(name),
                name,
                color: avatarColor(m.id),
                group: group?.name ?? '',
                barangay: group?.barangay ?? '',
                lesson: m.currentLesson ?? '—',
                devotionDate: formatDate(m.createdAt),
                attendanceDate: formatDate(m.createdAt),
                status: m.inactiveAt
                    ? 'Inactive'
                    : m.progress === 0 ? 'Needs Follow-up' : 'Active',
            };
        }),
    };
}

export function toCoordMentor(row: MentorSummary): CoordMentor {
    return {
        id: row.id,
        initials: row.initials,
        name: row.name,
        color: avatarColor(row.id),
        group: row.groups[0]?.name ?? '—',
        barangay: row.groups[0]?.barangay ?? '',
        phone: row.phone,
        email: row.email,
        activeMentees: row.activeMentees,
        groupCapacity: row.groupCapacity,
        availableSlots: row.availableSlots,
        status: row.status === 'Active' ? 'Active' : 'Inactive',
    };
}

export function toMHMentor(row: MentorSummary): MHMentor {
    return {
        id: row.id,
        initials: row.initials,
        name: row.name,
        color: avatarColor(row.id),
        cluster: row.clusterName,
        totalGroups: row.numberOfGroups,
        activeMentees: row.activeMentees,
        status: row.status === 'Active' ? 'Active' : 'Inactive',
        phone: row.phone,
        dateAssigned: formatDate(row.dateAssigned),
    };
}

// --- Clusters and activity --------------------------------------------------

export function toOutreachCluster(row: ClusterOverview): OutreachCluster {
    const headName = row.clusterHead?.name ?? '—';
    const coordName = row.coordinator?.name ?? '—';
    return {
        id: row.id,
        name: row.name,
        clusterHead: headName,
        clusterHeadInitials: row.clusterHead?.initials ?? '—',
        clusterHeadColor: avatarColor(row.clusterHead?.id ?? row.id),
        coordinator: coordName,
        coordinatorInitials: row.coordinator?.initials ?? '—',
        coordinatorColor: avatarColor(row.coordinator?.id ?? row.name),
        totalGroups: row.totalGroups,
        totalMentors: row.totalMentors,
        totalPotentialMentees: row.totalPotentialMentees,
        totalActiveMentees: row.totalActiveMentees,
        communityBased: row.communityBased,
        churchBased: row.churchBased,
        barangays: row.barangays,
        lat: row.mapLat ?? DEFAULT_LAT,
        lng: row.mapLng ?? DEFAULT_LNG,
    };
}

export function toNotification(item: ActivityItem): DashboardNotification {
    return {
        id: item.id,
        type: item.type,
        text: item.text,
        time: relativeTime(item.at),
        // Read state isn't persisted yet — everything older than a day reads as seen.
        read: Date.now() - new Date(item.at).getTime() > 24 * 3600 * 1000,
    };
}

// --- Church-wide dashboard --------------------------------------------------

// Department series colours, applied by position so the charts stay readable
// however many departments the tenant has.
const DEPT_COLORS = ['#4DA6F5', '#F5C842', '#5CB85C', '#E05C5C', '#C5A3E0', '#0b9b8a', '#e67700'];

export function toSharedDashboardData(stats: ChurchWideStats): SharedDashboardData {
    return {
        totalWorkers: stats.totalWorkers,
        totalMentors: stats.totalMentors,
        totalMentees: stats.totalMentees,
        totalGroups: stats.totalGroups,
        deptWorkers: stats.deptWorkers.map((row, i) => ({
            ...row,
            color: DEPT_COLORS[i % DEPT_COLORS.length],
        })),
        totalF2F: stats.totalF2F,
        totalOnline: stats.totalOnline,
        deptMentees: stats.deptMentees,
        totalChurch: stats.totalChurch,
        totalCommunity: stats.totalCommunity,
        deptGroups: stats.deptGroups,
    };
}
