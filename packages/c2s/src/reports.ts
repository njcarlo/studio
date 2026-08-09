import { prisma } from '@studio/database/prisma';

/**
 * Aggregates behind the C2S report tabs and the shared church-wide dashboard.
 *
 * Everything here is computed from the database. The month buckets are built
 * in application code rather than SQL so the same helpers work across the
 * different date columns each series counts from.
 */

// --- Month bucketing --------------------------------------------------------

export type MonthBucket = { key: string; label: string; start: Date; end: Date };

/** The last `count` months ending with the current one, oldest first. */
export function recentMonths(count: number, now: Date = new Date()): MonthBucket[] {
    const buckets: MonthBucket[] = [];
    for (let i = count - 1; i >= 0; i--) {
        const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
        const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
        buckets.push({
            key: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`,
            label: start.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
            start,
            end,
        });
    }
    return buckets;
}

function monthKey(date: Date): string {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Running total of rows created at or before the end of each bucket. */
function cumulativeByMonth(dates: Date[], months: MonthBucket[]): number[] {
    return months.map((m) => dates.filter((d) => d < m.end).length);
}

/** Rows created inside each bucket. */
function countByMonth(dates: Date[], months: MonthBucket[]): number[] {
    const counts = new Map<string, number>();
    for (const d of dates) {
        const key = monthKey(d);
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return months.map((m) => counts.get(m.key) ?? 0);
}

// --- Growth -----------------------------------------------------------------

export type GrowthPoint = { month: string; mentees: number; mentors: number };

/**
 * Cumulative mentee and mentor counts per month — the growth line on the
 * cluster-head and ministry-head report tabs.
 */
export async function menteeGrowth(
    clusterIds?: string[],
    months = 6,
): Promise<GrowthPoint[]> {
    const scope = clusterIds?.length ? { group: { clusterId: { in: clusterIds } } } : {};
    const buckets = recentMonths(months);

    const [mentees, mentors] = await Promise.all([
        prisma.c2SMentee.findMany({ where: scope, select: { createdAt: true } }),
        prisma.c2SMentorAssignment.findMany({
            where: clusterIds?.length ? { clusterId: { in: clusterIds } } : {},
            select: { dateAssigned: true },
        }),
    ]);

    const menteeSeries = cumulativeByMonth(mentees.map((m) => m.createdAt), buckets);
    const mentorSeries = cumulativeByMonth(mentors.map((m) => m.dateAssigned), buckets);

    return buckets.map((b, i) => ({
        month: b.label,
        mentees: menteeSeries[i],
        mentors: mentorSeries[i],
    }));
}

// --- Coordinator series -----------------------------------------------------

export type AssignmentPoint = { month: string; assigned: number; pending: number };

/** Requests assigned to a mentor vs still waiting, per month of submission. */
export async function assignmentTrend(
    clusterIds?: string[],
    months = 6,
): Promise<AssignmentPoint[]> {
    const buckets = recentMonths(months);
    const requests = await prisma.c2SJoinRequest.findMany({
        where: clusterIds?.length ? { group: { clusterId: { in: clusterIds } } } : {},
        select: { createdAt: true, assignedMentorId: true },
    });

    const assigned = countByMonth(
        requests.filter((r) => r.assignedMentorId).map((r) => r.createdAt),
        buckets,
    );
    const pending = countByMonth(
        requests.filter((r) => !r.assignedMentorId).map((r) => r.createdAt),
        buckets,
    );

    return buckets.map((b, i) => ({ month: b.label, assigned: assigned[i], pending: pending[i] }));
}

export type NamedCount = { name: string; value: number };

/** Potential mentees per month of submission. */
export async function potentialMenteeTrend(
    clusterIds?: string[],
    months = 6,
): Promise<NamedCount[]> {
    const buckets = recentMonths(months);
    const requests = await prisma.c2SJoinRequest.findMany({
        where: clusterIds?.length ? { group: { clusterId: { in: clusterIds } } } : {},
        select: { createdAt: true },
    });
    const counts = countByMonth(requests.map((r) => r.createdAt), buckets);
    return buckets.map((b, i) => ({ name: b.label, value: counts[i] }));
}

/** Active mentees per barangay. */
export async function menteesByBarangay(clusterIds?: string[]): Promise<NamedCount[]> {
    const groups = await prisma.c2SGroup.findMany({
        where: clusterIds?.length ? { clusterId: { in: clusterIds } } : {},
        select: { barangay: true, _count: { select: { mentees: true } } },
    });

    const totals = new Map<string, number>();
    for (const g of groups) {
        const name = g.barangay ?? 'Unassigned';
        totals.set(name, (totals.get(name) ?? 0) + g._count.mentees);
    }

    return [...totals]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
}

/** Active mentees per mentor, highest first. */
export async function menteesByMentor(clusterIds?: string[]): Promise<NamedCount[]> {
    const assignments = await prisma.c2SMentorAssignment.findMany({
        where: { status: 'Active', ...(clusterIds?.length ? { clusterId: { in: clusterIds } } : {}) },
        select: { workerId: true },
    });
    const workerIds = assignments.map((a) => a.workerId);
    if (workerIds.length === 0) return [];

    const [workers, mentees] = await Promise.all([
        prisma.worker.findMany({
            where: { id: { in: workerIds } },
            select: { id: true, firstName: true },
        }),
        prisma.c2SMentee.groupBy({
            by: ['mentorId'],
            where: { mentorId: { in: workerIds }, inactiveAt: null },
            _count: { _all: true },
        }),
    ]);

    const countBy = new Map(mentees.map((m) => [m.mentorId, m._count._all]));
    return workers
        .map((w) => ({ name: w.firstName, value: countBy.get(w.id) ?? 0 }))
        .sort((a, b) => b.value - a.value);
}

// --- Church-wide ------------------------------------------------------------

export type ChurchWideStats = {
    totalWorkers: number;
    totalMentors: number;
    totalMentees: number;
    totalGroups: number;
    deptWorkers: { dept: string; workers: number; mentors: number }[];
    totalF2F: number;
    totalOnline: number;
    deptMentees: { dept: string; f2f: number; online: number; total: number }[];
    totalChurch: number;
    totalCommunity: number;
    deptGroups: { dept: string; church: number; community: number; total: number }[];
};

/**
 * Church-wide totals broken down by department, attributing each C2S group to
 * the department of the worker mentoring it.
 */
export async function churchWideStats(): Promise<ChurchWideStats> {
    const [departments, ministries, workers, groups, mentorAssignments] = await Promise.all([
        prisma.department.findMany({ orderBy: { weight: 'desc' } }),
        prisma.ministry.findMany({ select: { id: true, departmentCode: true } }),
        prisma.worker.findMany({
            where: { status: 'Active' },
            select: { id: true, majorMinistryId: true },
        }),
        prisma.c2SGroup.findMany({
            select: {
                mentorId: true,
                groupType: true,
                meetingMode: true,
                _count: { select: { mentees: true } },
            },
        }),
        prisma.c2SMentorAssignment.findMany({ where: { status: 'Active' }, select: { workerId: true } }),
    ]);

    const deptOfMinistry = new Map(ministries.map((m) => [m.id, m.departmentCode]));
    const deptOfWorker = new Map(
        workers.map((w) => [w.id, deptOfMinistry.get(w.majorMinistryId) ?? null]),
    );
    const mentorIds = new Set(mentorAssignments.map((a) => a.workerId));

    const blank = () => ({
        workers: 0, mentors: 0,
        f2f: 0, online: 0,
        church: 0, community: 0,
    });
    const byDept = new Map(departments.map((d) => [d.code, blank()]));
    const bucketFor = (code: string | null | undefined) =>
        (code && byDept.get(code)) || null;

    for (const w of workers) {
        const bucket = bucketFor(deptOfWorker.get(w.id));
        if (!bucket) continue;
        bucket.workers += 1;
        if (mentorIds.has(w.id)) bucket.mentors += 1;
    }

    for (const g of groups) {
        const bucket = bucketFor(deptOfWorker.get(g.mentorId));
        if (!bucket) continue;
        if (g.meetingMode === 'Online') bucket.online += g._count.mentees;
        else bucket.f2f += g._count.mentees;
        if (g.groupType === 'Church-based') bucket.church += 1;
        else bucket.community += 1;
    }

    const rows = departments.map((d) => ({ dept: d.name, ...byDept.get(d.code)! }));
    const sum = (pick: (r: (typeof rows)[number]) => number) => rows.reduce((t, r) => t + pick(r), 0);

    return {
        totalWorkers: workers.length,
        totalMentors: mentorIds.size,
        totalMentees: groups.reduce((t, g) => t + g._count.mentees, 0),
        totalGroups: groups.length,
        deptWorkers: rows.map((r) => ({ dept: r.dept, workers: r.workers, mentors: r.mentors })),
        totalF2F: sum((r) => r.f2f),
        totalOnline: sum((r) => r.online),
        deptMentees: rows.map((r) => ({
            dept: r.dept, f2f: r.f2f, online: r.online, total: r.f2f + r.online,
        })),
        totalChurch: sum((r) => r.church),
        totalCommunity: sum((r) => r.community),
        deptGroups: rows.map((r) => ({
            dept: r.dept, church: r.church, community: r.community, total: r.church + r.community,
        })),
    };
}
