"use server";

import { prisma } from '@studio/database/prisma';
import { adminAuth } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

const ORS_BASE = 'https://cogdasma.com/ors-reader/public';

// ─── Shared types ───────────────────────────────────────────────────────────

export type OrsPagedResponse<T> = {
    data: T[];
    meta: { total: number; page: number; limit: number; totalPages: number };
};

export type ImportResult = {
    success: number;
    skipped: number;
    failed: number;
    errors: string[];
};

// ─── ORS entity types ───────────────────────────────────────────────────────

export type OrsWorker = {
    id: number;
    first_name: string;
    last_name: string;
    email: string | null;
    username: string | null;
    mobile: string | null;
    birthdate: string | null;
    ministry_id: number | null;
    sec_ministry_id: number | null;
    status: string | null;
    worker_type: string | null;
    qrdata: string | null;
    address: string | null;
    facebook_handle: string | null;
    worker_status: string | null;
    area_id: number | null;
    church_id: number | null;
};

export type OrsMinistry = {
    id: number;
    name: string;
    department_id: number;
    head_id: number | null;
};

export type OrsArea = {
    id: number;
    name: string;
    short_name: string;
};

export type OrsSatellite = {
    id: number;
    name: string;
};

export type OrsMentorGroup = {
    id: number;
    group_id: number;
    mentor_id: number;
    name: string;
    group_type: number | null;
    status: string | null;
    mentor_name: string | null;
};

export type OrsMentee = {
    id: number;
    worker_id: number;
    group_id: number;
    name: string;
    contact: string | null;
    connection_type: string | null;
    connection_year: number | null;
    c2s_manual_status: string | null;
};

export type OrsAttendanceScan = {
    id: number;
    worker_id: number;
    scanner_site_id: number | null;
    date_scanned: string;
};

// ─── ORS department → Prisma enum mapping ───────────────────────────────────
// ORS departments: 1=Worship, 2=Outreach, 3=Relationship, 4=Discipleship,
// 5=Administration, 6=Pastoral (no direct match → Discipleship)

const ORS_DEPT_MAP: Record<number, string> = {
    1: 'Worship',
    2: 'Outreach',
    3: 'Relationship',
    4: 'Discipleship',
    5: 'Administration',
    6: 'Discipleship', // Pastoral → closest
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapEmploymentType(workerType: string | null): string {
    if (!workerType) return 'Volunteer';
    const lower = workerType.toLowerCase();
    if (lower.includes('full')) return 'Full-Time';
    if (lower.includes('part')) return 'On-Call';
    return 'Volunteer';
}

function mapStatus(status: string | null): string {
    return status?.toLowerCase() === 'active' ? 'Active' : 'Inactive';
}

async function orsFetch<T>(path: string): Promise<T> {
    const res = await fetch(`${ORS_BASE}${path}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`ORS fetch failed: ${path} (${res.status})`);
    return res.json();
}

// ─── Overview stats ──────────────────────────────────────────────────────────

export type OrsSyncStats = {
    workers:    { total: number; imported: number };
    ministries: { total: number; imported: number };
    branches:   { total: number; imported: number };
    areas:      { total: number; imported: number };
    c2sGroups:  { total: number; imported: number };
    mentees:    { total: number; imported: number };
    attendance: { total: number; imported: number };
};

export async function getOrsSyncStats(): Promise<OrsSyncStats> {
    const [
        orsWorkers, orsMinistries, orsSatellites, orsAreas,
        orsGroups, orsMentees, orsAttendance,
        impWorkers, impMinistries, impBranches, impAreas,
        impGroups, impMentees, impAttendance,
    ] = await Promise.all([
        orsFetch<OrsPagedResponse<any>>('/tables/worker?page=1&limit=1'),
        orsFetch<OrsPagedResponse<any>>('/tables/ministry?page=1&limit=1'),
        orsFetch<OrsPagedResponse<any>>('/tables/satellite?page=1&limit=1'),
        orsFetch<OrsPagedResponse<any>>('/tables/area?page=1&limit=1'),
        orsFetch<OrsPagedResponse<any>>('/tables/c2s_online_group_view?page=1&limit=1'),
        orsFetch<OrsPagedResponse<any>>('/tables/mentee?page=1&limit=1'),
        orsFetch<OrsPagedResponse<any>>('/tables/hr_attendance_scan?page=1&limit=1'),
        prisma.worker.count({ where: { workerId: { not: null } } }),
        prisma.ministry.count(),
        prisma.branch.count(),
        prisma.area.count(),
        prisma.c2SGroup.count(),
        prisma.c2SMentee.count(),
        prisma.attendanceRecord.count(),
    ]);

    return {
        workers:    { total: orsWorkers.meta.total,    imported: impWorkers },
        ministries: { total: orsMinistries.meta.total, imported: impMinistries },
        branches:   { total: orsSatellites.meta.total, imported: impBranches },
        areas:      { total: orsAreas.meta.total,      imported: impAreas },
        c2sGroups:  { total: orsGroups.meta.total,     imported: impGroups },
        mentees:    { total: orsMentees.meta.total,    imported: impMentees },
        attendance: { total: orsAttendance.meta.total, imported: impAttendance },
    };
}

// ─── Ministry map (ORS ministry id → new ministry id, matched by name) ──────

export async function getOrsMinistryMap(): Promise<Record<string, string>> {
    const [orsRes, newMinistries] = await Promise.all([
        orsFetch<OrsPagedResponse<OrsMinistry>>('/tables/ministry?limit=200'),
        prisma.ministry.findMany(),
    ]);
    const map: Record<string, string> = {};
    for (const orsMin of orsRes.data) {
        const normalized = (orsMin.name || '').toLowerCase().trim();
        const match = newMinistries.find((m: any) => m.name.toLowerCase().trim() === normalized);
        if (match) map[String(orsMin.id)] = match.id;
    }
    return map;
}

// ─── WORKERS ─────────────────────────────────────────────────────────────────

export async function previewOrsWorkers(
    page = 1, limit = 50, search?: string
): Promise<OrsPagedResponse<OrsWorker>> {
    let path = `/tables/worker?page=${page}&limit=${limit}`;
    if (search) path += `&filter[first_name]=${encodeURIComponent(search)}`;
    return orsFetch(path);
}

export async function importOrsWorkersBatch(
    workers: OrsWorker[],
    defaultRoleId = 'viewer',
    ministryIdMap: Record<string, string> = {}
): Promise<ImportResult> {
    const result: ImportResult = { success: 0, skipped: 0, failed: 0, errors: [] };

    for (const w of workers) {
        if (!w.email) {
            result.skipped++;
            result.errors.push(`Worker #${w.id} (${w.first_name} ${w.last_name}): no email`);
            continue;
        }
        try {
            const existing = await prisma.worker.findFirst({
                where: { OR: [{ workerId: String(w.id) }, { email: w.email }] },
            });
            if (existing) { result.skipped++; continue; }

            let firebaseUid: string | undefined;
            try {
                const tempPw = `ORS_${w.id}_${Math.random().toString(36).slice(2, 10)}`;
                const rec = await adminAuth().createUser({
                    email: w.email,
                    password: tempPw,
                    displayName: `${w.first_name} ${w.last_name}`.trim(),
                    disabled: mapStatus(w.status) !== 'Active',
                });
                firebaseUid = rec.uid;
            } catch (authErr: any) {
                if (authErr.code === 'auth/email-already-exists') {
                    try { firebaseUid = (await adminAuth().getUserByEmail(w.email)).uid; } catch { /* ok */ }
                }
            }

            const majorMinistryId = w.ministry_id ? (ministryIdMap[String(w.ministry_id)] || '') : '';
            const minorMinistryId = w.sec_ministry_id ? (ministryIdMap[String(w.sec_ministry_id)] || '') : '';

            await prisma.worker.create({
                data: {
                    ...(firebaseUid ? { id: firebaseUid } : {}),
                    workerId: String(w.id),
                    firstName: w.first_name || '',
                    lastName: w.last_name || '',
                    email: w.email,
                    phone: w.mobile || '',
                    roleId: defaultRoleId,
                    status: mapStatus(w.status),
                    avatarUrl: `https://picsum.photos/seed/${w.id}/100/100`,
                    majorMinistryId,
                    minorMinistryId,
                    employmentType: mapEmploymentType(w.worker_type),
                    birthDate: w.birthdate || null,
                    passwordChangeRequired: true,
                    qrToken: w.qrdata || null,
                },
            });
            result.success++;
        } catch (err: any) {
            result.failed++;
            result.errors.push(`Worker #${w.id}: ${err.message}`);
        }
    }

    if (result.success > 0) revalidatePath('/workers');
    return result;
}

// ─── MINISTRIES ──────────────────────────────────────────────────────────────

export async function previewOrsMinistries(
    page = 1, limit = 50
): Promise<OrsPagedResponse<OrsMinistry>> {
    return orsFetch(`/tables/ministry?page=${page}&limit=${limit}`);
}

export async function importOrsMinistries(
    ministries: OrsMinistry[]
): Promise<ImportResult> {
    const result: ImportResult = { success: 0, skipped: 0, failed: 0, errors: [] };

    // Build worker lookup for head_id → new worker id
    const allWorkers = await prisma.worker.findMany({ select: { id: true, workerId: true } });
    const workerIdMap = Object.fromEntries(
        allWorkers.filter((w: any) => w.workerId).map((w: any) => [w.workerId, w.id])
    );

    for (const m of ministries) {
        try {
            const existing = await prisma.ministry.findFirst({
                where: { name: { equals: m.name, mode: 'insensitive' } },
            });
            if (existing) { result.skipped++; continue; }

            const department = ORS_DEPT_MAP[m.department_id] || 'Discipleship';
            const headId = m.head_id ? (workerIdMap[String(m.head_id)] || null) : null;

            await prisma.ministry.create({
                data: {
                    name: m.name,
                    description: '',
                    department: department as any,
                    leaderId: headId || '',
                    headId: headId || null,
                },
            });
            result.success++;
        } catch (err: any) {
            result.failed++;
            result.errors.push(`Ministry "${m.name}": ${err.message}`);
        }
    }

    if (result.success > 0) revalidatePath('/settings/ministries');
    return result;
}

// ─── AREAS & BRANCHES ────────────────────────────────────────────────────────

export async function previewOrsSatellites(
    page = 1, limit = 50
): Promise<OrsPagedResponse<OrsSatellite>> {
    return orsFetch(`/tables/satellite?page=${page}&limit=${limit}`);
}

export async function previewOrsAreas(
    page = 1, limit = 50
): Promise<OrsPagedResponse<OrsArea>> {
    return orsFetch(`/tables/area?page=${page}&limit=${limit}`);
}

export async function importOrsSatellites(
    satellites: OrsSatellite[]
): Promise<ImportResult> {
    const result: ImportResult = { success: 0, skipped: 0, failed: 0, errors: [] };

    for (const s of satellites) {
        try {
            const existing = await prisma.branch.findFirst({
                where: { name: { equals: s.name, mode: 'insensitive' } },
            });
            if (existing) { result.skipped++; continue; }

            await prisma.branch.create({ data: { name: s.name } });
            result.success++;
        } catch (err: any) {
            result.failed++;
            result.errors.push(`Branch "${s.name}": ${err.message}`);
        }
    }
    return result;
}

export async function importOrsAreas(
    areas: OrsArea[]
): Promise<ImportResult> {
    const result: ImportResult = { success: 0, skipped: 0, failed: 0, errors: [] };

    // Find or create a "Main" branch to place imported areas under
    let mainBranch = await prisma.branch.findFirst({
        where: { name: { equals: 'Main', mode: 'insensitive' } },
    });
    if (!mainBranch) {
        mainBranch = await prisma.branch.create({ data: { name: 'Main' } });
    }

    for (const a of areas) {
        try {
            const existing = await prisma.area.findFirst({
                where: { name: { equals: a.name, mode: 'insensitive' }, branchId: mainBranch!.id },
            });
            if (existing) { result.skipped++; continue; }

            await prisma.area.create({
                data: {
                    name: a.name,
                    areaId: a.short_name || null,
                    branchId: mainBranch!.id,
                },
            });
            result.success++;
        } catch (err: any) {
            result.failed++;
            result.errors.push(`Area "${a.name}": ${err.message}`);
        }
    }
    return result;
}

// ─── C2S GROUPS ──────────────────────────────────────────────────────────────

export async function previewOrsMentorGroups(
    page = 1, limit = 50
): Promise<OrsPagedResponse<OrsMentorGroup>> {
    return orsFetch(`/tables/c2s_online_group_view?page=${page}&limit=${limit}`);
}

export async function importOrsMentorGroups(
    groups: OrsMentorGroup[]
): Promise<ImportResult> {
    const result: ImportResult = { success: 0, skipped: 0, failed: 0, errors: [] };

    // Build worker id map: ORS worker id → new worker id
    const allWorkers = await prisma.worker.findMany({ select: { id: true, workerId: true } });
    const workerIdMap = Object.fromEntries(
        allWorkers.filter((w: any) => w.workerId).map((w: any) => [w.workerId, w.id])
    );

    for (const g of groups) {
        try {
            const mentorNewId = workerIdMap[String(g.mentor_id)];
            // Deduplicate by ORS group_id in the group name prefix
            const existing = await prisma.c2SGroup.findFirst({
                where: { name: g.name, mentorId: mentorNewId || '' },
            });
            if (existing) { result.skipped++; continue; }

            await prisma.c2SGroup.create({
                data: {
                    name: g.name,
                    mentorId: mentorNewId || '',
                    menteeIds: [],
                },
            });
            result.success++;
        } catch (err: any) {
            result.failed++;
            result.errors.push(`Group "${g.name}": ${err.message}`);
        }
    }

    if (result.success > 0) revalidatePath('/c2s');
    return result;
}

// ─── C2S MENTEES ─────────────────────────────────────────────────────────────

export async function previewOrsMentees(
    page = 1, limit = 50
): Promise<OrsPagedResponse<OrsMentee>> {
    return orsFetch(`/tables/mentee?page=${page}&limit=${limit}`);
}

export async function importOrsMentees(
    mentees: OrsMentee[]
): Promise<ImportResult> {
    const result: ImportResult = { success: 0, skipped: 0, failed: 0, errors: [] };

    const allWorkers = await prisma.worker.findMany({ select: { id: true, workerId: true, firstName: true, lastName: true, email: true, phone: true } });
    const workerByOrsId = Object.fromEntries(
        allWorkers.filter((w: any) => w.workerId).map((w: any) => [w.workerId, w])
    );

    const allGroups = await prisma.c2SGroup.findMany({ select: { id: true, mentorId: true, name: true } });
    // Build map: mentorNewId → groups[]
    const groupsByMentor: Record<string, typeof allGroups> = {};
    for (const g of allGroups) {
        if (!groupsByMentor[g.mentorId]) groupsByMentor[g.mentorId] = [];
        groupsByMentor[g.mentorId].push(g);
    }

    // Pre-fetch ORS groups to resolve ORS group_id → mentor_id
    const orsGroups = await orsFetch<OrsPagedResponse<OrsMentorGroup>>('/tables/c2s_online_group_view?limit=200');
    const orsGroupMap = Object.fromEntries(orsGroups.data.map((g) => [String(g.group_id || g.id), g]));

    for (const m of mentees) {
        try {
            const existing = await prisma.c2SMentee.findFirst({
                where: { email: `ors_mentee_${m.id}@legacy.ors` },
            });
            if (existing) { result.skipped++; continue; }

            // Resolve worker (mentee is a worker in ORS)
            const workerRec = workerByOrsId[String(m.worker_id)] as any;

            // Split name → firstName / lastName
            const nameParts = (m.name || '').trim().split(/\s+/);
            const firstName = workerRec?.firstName || nameParts[0] || 'Unknown';
            const lastName = workerRec?.lastName || nameParts.slice(1).join(' ') || '';
            const email = workerRec?.email || `ors_mentee_${m.id}@legacy.ors`;
            const phone = workerRec?.phone || m.contact || '';

            // Resolve group → find new C2SGroup via ORS group mentor_id
            let groupId = '';
            let mentorId = '';
            const orsGroup = orsGroupMap[String(m.group_id)];
            if (orsGroup) {
                const mentorNewId = workerByOrsId[String(orsGroup.mentor_id)]?.id as string || '';
                mentorId = mentorNewId;
                const candidateGroups = groupsByMentor[mentorNewId] || [];
                const matchedGroup = candidateGroups.find((g: any) => g.name === orsGroup.name)
                    || candidateGroups[0];
                if (matchedGroup) groupId = matchedGroup.id;
            }

            if (!groupId) {
                result.skipped++;
                result.errors.push(`Mentee #${m.id} (${m.name}): no matching C2S group found — import groups first`);
                continue;
            }

            await prisma.c2SMentee.create({
                data: {
                    firstName,
                    lastName,
                    email,
                    phone,
                    status: mapStatus(m.c2s_manual_status),
                    groupId,
                    mentorId,
                },
            });
            result.success++;
        } catch (err: any) {
            result.failed++;
            result.errors.push(`Mentee #${m.id}: ${err.message}`);
        }
    }

    if (result.success > 0) revalidatePath('/c2s');
    return result;
}

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────

export async function previewOrsAttendance(
    page = 1, limit = 50
): Promise<OrsPagedResponse<OrsAttendanceScan>> {
    return orsFetch(`/tables/hr_attendance_scan?page=${page}&limit=${limit}`);
}

export async function importOrsAttendanceBatch(
    records: OrsAttendanceScan[]
): Promise<ImportResult> {
    const result: ImportResult = { success: 0, skipped: 0, failed: 0, errors: [] };

    const allWorkers = await prisma.worker.findMany({ select: { id: true, workerId: true } });
    const workerIdMap = Object.fromEntries(
        allWorkers.filter((w: any) => w.workerId).map((w: any) => [w.workerId, w.id])
    );

    const toCreate: { workerProfileId: string; type: string; time: Date }[] = [];

    for (const r of records) {
        const newWorkerId = workerIdMap[String(r.worker_id)];
        if (!newWorkerId) {
            result.skipped++;
            continue;
        }
        toCreate.push({
            workerProfileId: newWorkerId,
            type: 'Attendance Scan',
            time: new Date(r.date_scanned),
        });
    }

    if (toCreate.length > 0) {
        try {
            const inserted = await prisma.attendanceRecord.createMany({
                data: toCreate,
                skipDuplicates: true,
            });
            result.success = inserted.count;
            result.skipped += records.length - toCreate.length;
        } catch (err: any) {
            result.failed = toCreate.length;
            result.errors.push(err.message);
        }
    }

    return result;
}
