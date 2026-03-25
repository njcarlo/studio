"use server";

import { prisma } from '@studio/database/prisma';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

const ORS_BASE = 'https://cogdasma.com/ors-reader/public';

// ─── Shared types ────────────────────────────────────────────────────────────

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

// ─── ORS entity types ────────────────────────────────────────────────────────

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
    start_month: string | null;
    start_year: string | null;
    remarks: string | null;
    biometrics_id: number | null;
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

// ─── Worker diff types ───────────────────────────────────────────────────────

export type HashType = 'MD5' | 'SHA1' | 'SHA256' | 'PLAIN' | 'NONE';

export type WorkerSyncStatus = 'new' | 'updated' | 'synced' | 'orphan';

export type WorkerSyncDirection = 'legacy_to_new' | 'new_to_legacy';

export type PasswordSyncStatus = 'synced' | 'has_password' | 'changed' | 'no_password' | 'not_set';

export type ExistingWorkerSummary = {
    id: string;
    workerId: string | null;
    workerNumber: number | null;
    legacyPasswordHash: string | null;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string | null;
    birthDate: string | null;
    startMonth: string | null;
    startYear: string | null;
    remarks: string | null;
    biometricsId: number | null;
    qrToken: string | null;
    status: string;
    majorMinistryId: string;
    minorMinistryId: string;
    employmentType: string | null;
    roleId: string | null;
};

export type WorkerDiffRecord = {
    ors: OrsWorker & { hash_type: HashType };
    existing: ExistingWorkerSummary | null;
    status: WorkerSyncStatus;
    direction: WorkerSyncDirection;
    passwordStatus: PasswordSyncStatus;
    diffFields: DiffField[];
};

export type DiffField = {
    label: string;
    ors: string;
    current: string;
};

export type SyncUpdatedWorkerInput = {
    worker: OrsWorker;
    fields?: string[];
};

// ─── ORS department → Department code mapping ───────────────────────────────

const ORS_DEPT_MAP: Record<number, string> = {
    1: 'W',
    2: 'O',
    3: 'R',
    4: 'D',
    5: 'A',
    6: 'D',
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

function detectHashType(password: string | null | undefined): HashType {
    if (!password) return 'NONE';
    const p = password.trim();
    if (p.length === 32 && /^[a-fA-F0-9]+$/.test(p)) return 'MD5';
    if (p.length === 40 && /^[a-fA-F0-9]+$/.test(p)) return 'SHA1';
    if (p.length === 64 && /^[a-fA-F0-9]+$/.test(p)) return 'SHA256';
    if (p.length > 0) return 'PLAIN';
    return 'NONE';
}

function normalizeLegacyPasswordHash(password: string | null | undefined): string | null {
    if (!password) return null;
    const p = password.trim();
    return p.length > 0 ? p : null;
}

function computePasswordStatus(
    legacyPassword: string | null | undefined,
    existing: ExistingWorkerSummary | null
): PasswordSyncStatus {
    const incoming = normalizeLegacyPasswordHash(legacyPassword);
    const current = normalizeLegacyPasswordHash(existing?.legacyPasswordHash);

    if (!incoming) return 'no_password';
    if (!existing) return 'has_password';
    if (!current) return 'not_set';
    if (incoming === current) return 'synced';
    return 'changed';
}

function computeDiffFields(
    ors: OrsWorker,
    existing: ExistingWorkerSummary,
    ministryMap: Record<string, string>
): DiffField[] {
    const diffs: DiffField[] = [];

    const orsFirst = (ors.first_name || '').trim();
    const orsLast = (ors.last_name || '').trim();
    const orsEmail = (ors.email || '').trim();
    const orsAddress = (ors.address || '').trim();
    const orsBirth = (ors.birthdate || '').trim();
    const orsStartMonth = (ors.start_month || '').trim();
    const orsStartYear = (ors.start_year || '').trim();
    const orsRemarks = (ors.remarks || '').trim();
    const orsBio = ors.biometrics_id != null ? String(ors.biometrics_id) : '';
    const orsQr = (ors.qrdata || '').trim();

    if (existing.workerNumber !== null && existing.workerNumber !== ors.id) {
        diffs.push({ label: 'Worker ID', ors: String(ors.id), current: String(existing.workerNumber) });
    }
    if (orsFirst !== existing.firstName) diffs.push({ label: 'First Name', ors: orsFirst, current: existing.firstName });
    if (orsLast !== existing.lastName) diffs.push({ label: 'Last Name', ors: orsLast, current: existing.lastName });
    if (orsEmail !== (existing.email || '').trim()) diffs.push({ label: 'Email', ors: orsEmail || '—', current: existing.email || '—' });
    if ((ors.mobile || '') !== (existing.phone || '')) diffs.push({ label: 'Phone', ors: ors.mobile || '—', current: existing.phone || '—' });
    if (orsAddress !== (existing.address || '').trim()) diffs.push({ label: 'Address', ors: orsAddress || '—', current: existing.address || '—' });
    if (orsBirth !== (existing.birthDate || '').trim()) diffs.push({ label: 'Birthdate', ors: orsBirth || '—', current: existing.birthDate || '—' });
    if (orsStartMonth !== (existing.startMonth || '').trim()) diffs.push({ label: 'Start Month', ors: orsStartMonth || '—', current: existing.startMonth || '—' });
    if (orsStartYear !== (existing.startYear || '').trim()) diffs.push({ label: 'Start Year', ors: orsStartYear || '—', current: existing.startYear || '—' });
    if (orsRemarks !== (existing.remarks || '').trim()) diffs.push({ label: 'Remarks', ors: orsRemarks || '—', current: existing.remarks || '—' });
    if (orsBio !== (existing.biometricsId != null ? String(existing.biometricsId) : '')) {
        diffs.push({ label: 'Biometrics ID', ors: orsBio || '—', current: existing.biometricsId != null ? String(existing.biometricsId) : '—' });
    }
    if (orsQr !== (existing.qrToken || '').trim()) diffs.push({ label: 'QR Data', ors: orsQr || '—', current: existing.qrToken || '—' });
    if (mapStatus(ors.status) !== existing.status) diffs.push({ label: 'Status', ors: mapStatus(ors.status), current: existing.status });
    if (mapEmploymentType(ors.worker_type) !== (existing.employmentType || 'Volunteer')) {
        diffs.push({ label: 'Employment', ors: mapEmploymentType(ors.worker_type), current: existing.employmentType || 'Volunteer' });
    }
    const orsMajorId = ors.ministry_id ? (ministryMap[String(ors.ministry_id)] || '') : '';
    if (orsMajorId && orsMajorId !== existing.majorMinistryId) {
        diffs.push({ label: 'Ministry', ors: `ID:${orsMajorId}`, current: `ID:${existing.majorMinistryId}` });
    }

    return diffs;
}

async function orsFetch<T>(path: string): Promise<T> {
    const res = await fetch(`${ORS_BASE}${path}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`ORS fetch failed: ${path} (${res.status})`);
    return res.json();
}

async function fetchAllOrsWorkerIds(): Promise<Set<string>> {
    const limit = 500;
    const first = await orsFetch<OrsPagedResponse<{ id: number }>>(`/tables/worker?page=1&limit=${limit}`);
    const all = new Set<string>(first.data.map((w) => String(w.id)));

    for (let page = 2; page <= first.meta.totalPages; page++) {
        const res = await orsFetch<OrsPagedResponse<{ id: number }>>(`/tables/worker?page=${page}&limit=${limit}`);
        for (const w of res.data) all.add(String(w.id));
    }

    return all;
}

async function fetchAllOrsWorkers(): Promise<any[]> {
    const limit = 500;
    const first = await orsFetch<OrsPagedResponse<any>>(`/tables/worker?page=1&limit=${limit}`);
    const all = [...first.data];

    for (let page = 2; page <= first.meta.totalPages; page++) {
        const res = await orsFetch<OrsPagedResponse<any>>(`/tables/worker?page=${page}&limit=${limit}`);
        all.push(...res.data);
    }

    return all;
}

async function logOrsSyncEvent(action: string, details: string, targetId?: string, targetName?: string) {
    try {
        await prisma.transactionLog.create({
            data: {
                action,
                module: 'ors-sync',
                details,
                targetId,
                targetName,
            },
        });
    } catch {
        // Logging must never block import/sync operations.
    }
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

// ─── Ministry map (ORS id → new app id, matched by name) ────────────────────

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

// ─── WORKER DIFF ─────────────────────────────────────────────────────────────

/**
 * Returns a paginated diff between ORS workers and the new app's DB.
 * Each record shows the ORS data, current state in new app (if any),
 * sync status (new/updated/synced), and field-level diffs.
 * Password hashes are detected server-side; only the hash type is returned.
 */
export async function getWorkerDiffPage(
    page = 1,
    limit = 50,
    search?: string,
    ministryMap: Record<string, string> = {},
    direction: WorkerSyncDirection | 'all' = 'all'
): Promise<OrsPagedResponse<WorkerDiffRecord>> {
    const includeLegacy = direction === 'all' || direction === 'legacy_to_new';
    const includeOrphans = direction === 'all' || direction === 'new_to_legacy';

    let orsRes: OrsPagedResponse<any> = {
        data: [],
        meta: { total: 0, page, limit, totalPages: 1 },
    };

    let orsWorkers: any[] = [];

    if (includeLegacy) {
        if (!search) {
            const path = `/tables/worker?page=${page}&limit=${limit}`;
            orsRes = await orsFetch<OrsPagedResponse<any>>(path);
            orsWorkers = orsRes.data;
        } else {
            const q = search.toLowerCase().trim();
            const allLegacy = await fetchAllOrsWorkers();
            const filtered = allLegacy.filter((w) =>
                String(w.id || '').includes(q) ||
                String(w.first_name || '').toLowerCase().includes(q) ||
                String(w.last_name || '').toLowerCase().includes(q) ||
                String(w.email || '').toLowerCase().includes(q)
            );
            const start = (page - 1) * limit;
            orsWorkers = filtered.slice(start, start + limit);
            orsRes = {
                data: orsWorkers,
                meta: {
                    total: filtered.length,
                    page,
                    limit,
                    totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
                },
            };
        }
    }

    // Bulk-lookup existing workers in one DB query for current ORS page
    const emails = orsWorkers.map(w => w.email).filter(Boolean) as string[];
    const orsIds = orsWorkers.map(w => String(w.id));

    const existing = orsWorkers.length > 0
        ? await prisma.worker.findMany({
            where: {
                OR: [
                    { workerId: { in: orsIds } },
                    ...(emails.length ? [{ email: { in: emails } }] : []),
                ],
            },
            select: {
                id: true, workerId: true, workerNumber: true, legacyPasswordHash: true, firstName: true, lastName: true,
                email: true, phone: true, address: true, birthDate: true, startMonth: true, startYear: true, remarks: true, biometricsId: true, qrToken: true, status: true,
                majorMinistryId: true, minorMinistryId: true,
                employmentType: true, roleId: true,
            },
        })
        : [];

    const byWorkerId: Record<string, ExistingWorkerSummary> = Object.fromEntries(
        existing.filter((w: any) => w.workerId).map((w: any) => [w.workerId, w])
    );
    const byEmail: Record<string, ExistingWorkerSummary> = Object.fromEntries(
        existing.map((w: any) => [w.email, w])
    );

    const records: WorkerDiffRecord[] = orsWorkers.map((orsWorker: any) => {
        const existingWorker =
            byWorkerId[String(orsWorker.id)] ||
            (orsWorker.email ? byEmail[orsWorker.email] : null) ||
            null;

        const hash_type = detectHashType(orsWorker.password);
        const passwordStatus = computePasswordStatus(orsWorker.password, existingWorker);
        let status: WorkerSyncStatus;
        let diffFields: DiffField[] = [];

        if (!existingWorker) {
            status = 'new';
        } else {
            diffFields = computeDiffFields(orsWorker, existingWorker, ministryMap);
            status = diffFields.length > 0 ? 'updated' : 'synced';
        }

        // Strip password from what we return to the client
        const { password: _pw, ...safeOrs } = orsWorker;

        return {
            ors: { ...safeOrs, hash_type },
            existing: existingWorker,
            status,
            direction: 'legacy_to_new',
            passwordStatus,
            diffFields,
        };
    });

    const orphanRecords: WorkerDiffRecord[] = [];
    if (includeOrphans) {
        const allOrsIds = await fetchAllOrsWorkerIds();
        const allNewWorkers = await prisma.worker.findMany({
            select: {
                id: true,
                workerId: true,
                workerNumber: true,
                legacyPasswordHash: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                address: true,
                birthDate: true,
                startMonth: true,
                startYear: true,
                remarks: true,
                biometricsId: true,
                qrToken: true,
                status: true,
                majorMinistryId: true,
                minorMinistryId: true,
                employmentType: true,
                roleId: true,
            },
        });

        const baseOrphans = allNewWorkers.filter((w) => {
            if (!w.workerId) return true;
            return !allOrsIds.has(String(w.workerId));
        });

        const filteredOrphans = (search
            ? baseOrphans.filter((w) => {
                const q = search.toLowerCase();
                return (
                    (w.firstName || '').toLowerCase().includes(q) ||
                    (w.lastName || '').toLowerCase().includes(q) ||
                    (w.email || '').toLowerCase().includes(q) ||
                    (w.workerId || '').toLowerCase().includes(q) ||
                    String(w.workerNumber || '').includes(q)
                );
            })
            : baseOrphans);

        const start = (page - 1) * limit;
        const slice = filteredOrphans.slice(start, start + limit);

        slice.forEach((w, idx) => {
            const stableId = (w.workerNumber ?? Number(w.workerId)) || -(start + idx + 1);
            orphanRecords.push({
                ors: {
                    id: stableId,
                    first_name: w.firstName,
                    last_name: w.lastName,
                    email: w.email,
                    username: null,
                    mobile: w.phone,
                    birthdate: null,
                    ministry_id: null,
                    sec_ministry_id: null,
                    status: w.status,
                    worker_type: w.employmentType,
                    qrdata: null,
                    address: null,
                    start_month: null,
                    start_year: null,
                    remarks: null,
                    biometrics_id: null,
                    facebook_handle: null,
                    worker_status: null,
                    area_id: null,
                    church_id: null,
                    hash_type: 'NONE',
                },
                existing: w,
                status: 'orphan',
                direction: 'new_to_legacy',
                passwordStatus: w.legacyPasswordHash ? 'has_password' : 'not_set',
                diffFields: [
                    {
                        label: 'Legacy Record',
                        ors: 'Missing in legacy ORS',
                        current: 'Exists in new system',
                    },
                ],
            });
        });

        if (!includeLegacy) {
            return {
                data: orphanRecords,
                meta: {
                    total: filteredOrphans.length,
                    page,
                    limit,
                    totalPages: Math.max(1, Math.ceil(filteredOrphans.length / limit)),
                },
            };
        }
    }

    return { data: [...records, ...orphanRecords], meta: orsRes.meta };
}

// ─── IMPORT NEW WORKERS ───────────────────────────────────────────────────────

/**
 * Imports NEW workers from ORS into the new app.
 * Re-fetches each worker from the ORS API server-side to get the password hash.
 * Creates Supabase Auth users with a temp password + passwordChangeRequired flag.
 * Legacy MD5/SHA1/SHA256 hashes are not migrated — workers must reset on first login.
 */
export async function importOrsNewWorkers(
    orsWorkerIds: number[],
    options: {
        defaultRoleId: string;
        ministryIdMap: Record<string, string>;
        migratePasswordHash: boolean;
    }
): Promise<ImportResult> {
    const { defaultRoleId, ministryIdMap, migratePasswordHash } = options;
    const supabaseAdmin = getSupabaseAdminClient();
    const result: ImportResult = { success: 0, skipped: 0, failed: 0, errors: [] };

    // Re-fetch workers from ORS server-side (includes password hash)
    // Chunk into batches of 10 concurrent requests
    const CHUNK = 10;
    const allWorkers: any[] = [];
    for (let i = 0; i < orsWorkerIds.length; i += CHUNK) {
        const chunk = orsWorkerIds.slice(i, i + CHUNK);
        const fetched = await Promise.all(
            chunk.map(id => orsFetch<any>(`/tables/worker/${id}`).catch(() => null))
        );
        allWorkers.push(...fetched.filter(Boolean));
    }

    // Supabase Auth does not support importing pre-hashed passwords.
    // All workers are created with a temp password and passwordChangeRequired = true.
    type WorkerWithHash = { worker: any };
    const toImport: WorkerWithHash[] = [];

    for (const w of allWorkers) {
        if (!w.email) {
            result.skipped++;
            result.errors.push(`Worker #${w.id} (${w.first_name} ${w.last_name}): no email, skipped`);
            continue;
        }

        const existingWorker = await prisma.worker.findFirst({
            where: { OR: [{ workerId: String(w.id) }, { email: w.email }] },
        });
        if (existingWorker) {
            result.skipped++;
            continue;
        }

        toImport.push({ worker: w });
    }

    // Helper: create DB worker record after Supabase auth user is established
    const createDbWorker = async (w: any, uid: string, passwordChangeRequired: boolean) => {
        const majorMinistryId = w.ministry_id ? (ministryIdMap[String(w.ministry_id)] || '') : '';
        const minorMinistryId = w.sec_ministry_id ? (ministryIdMap[String(w.sec_ministry_id)] || '') : '';
        const legacyPasswordHash = migratePasswordHash ? normalizeLegacyPasswordHash(w.password) : null;
        await prisma.worker.create({
            data: {
                id: uid,
                workerId: String(w.id),
                workerNumber: Number(w.id),
                legacyPasswordHash,
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
                address: w.address || null,
                startMonth: w.start_month || null,
                startYear: w.start_year || null,
                remarks: w.remarks || null,
                biometricsId: w.biometrics_id ?? null,
                passwordChangeRequired,
                qrToken: w.qrdata || null,
            },
        });
    };

    // Create a Supabase auth account, then mirror the user in Prisma
    for (const { worker: w } of toImport) {
        try {
            const tempPw = `ORS_${w.id}_${Math.random().toString(36).slice(2, 10)}`;
            let uid: string;

            const { data, error } = await supabaseAdmin.auth.admin.createUser({
                email: w.email!,
                password: tempPw,
                email_confirm: true,
            });

            if (error) {
                if (error.message.toLowerCase().includes('already registered')) {
                    // Worker already has a Supabase Auth account — find them in DB
                    const existingWorker = await prisma.worker.findFirst({
                        where: { email: w.email },
                        select: { id: true },
                    });
                    if (!existingWorker) {
                        result.failed++;
                        result.errors.push(`Worker #${w.id}: auth user exists but no DB record found`);
                        continue;
                    }
                    uid = existingWorker.id;
                } else {
                    throw new Error(error.message);
                }
            } else {
                uid = data.user.id;
            }

            await createDbWorker(w, uid, true);
            result.success++;
            await logOrsSyncEvent(
                'worker_imported',
                `Imported worker #${w.id} (${w.first_name} ${w.last_name}) from ORS`,
                String(w.id),
                `${w.first_name} ${w.last_name}`
            );
        } catch (err: any) {
            result.failed++;
            result.errors.push(`Worker #${w.id}: ${err.message}`);
        }
    }

    if (result.success > 0) revalidatePath('/workers');
    return result;
}

// ─── SYNC UPDATED WORKERS ────────────────────────────────────────────────────

/**
 * Updates fields on already-imported workers whose ORS data has changed.
 * Updates: firstName, lastName, phone, status, employmentType, ministry, qrToken.
 * Auth accounts remain in Supabase; this sync only updates Prisma worker fields.
 */
export async function syncOrsUpdatedWorkers(
    workers: Array<OrsWorker | SyncUpdatedWorkerInput>,
    ministryIdMap: Record<string, string> = {}
): Promise<ImportResult> {
    const result: ImportResult = { success: 0, skipped: 0, failed: 0, errors: [] };

    for (const item of workers) {
        const wrapped = typeof item === 'object' && item !== null && 'worker' in item;
        const w = (wrapped ? item.worker : item) as OrsWorker;
        try {
            const selected = wrapped && item.fields && item.fields.length > 0
                ? new Set(item.fields)
                : null;
            const wants = (label: string) => !selected || selected.has(label);

            const existing = await prisma.worker.findFirst({
                where: {
                    OR: [
                        { workerId: String(w.id) },
                        ...(w.email ? [{ email: w.email }] : []),
                    ],
                },
            });
            if (!existing) {
                result.skipped++;
                result.errors.push(`Worker #${w.id}: not found in new system — import first`);
                continue;
            }

            const majorMinistryId = w.ministry_id
                ? (ministryIdMap[String(w.ministry_id)] || existing.majorMinistryId)
                : existing.majorMinistryId;
            const minorMinistryId = w.sec_ministry_id
                ? (ministryIdMap[String(w.sec_ministry_id)] || existing.minorMinistryId)
                : existing.minorMinistryId;

            const data: any = {};
            if (wants('Worker ID')) {
                data.workerId = String(w.id);
                data.workerNumber = Number(w.id);
            }
            if (wants('First Name')) data.firstName = w.first_name || existing.firstName;
            if (wants('Last Name')) data.lastName = w.last_name || existing.lastName;
            if (wants('Email') && w.email) data.email = w.email;
            if (wants('Phone')) data.phone = w.mobile || existing.phone;
            if (wants('Address')) data.address = w.address || existing.address;
            if (wants('Status')) data.status = mapStatus(w.status);
            if (wants('Employment')) data.employmentType = mapEmploymentType(w.worker_type);
            if (wants('Ministry')) {
                data.majorMinistryId = majorMinistryId;
                data.minorMinistryId = minorMinistryId;
            }
            if (wants('QR Data')) data.qrToken = w.qrdata || existing.qrToken;
            if (wants('Birthdate')) data.birthDate = w.birthdate || existing.birthDate;
            if (wants('Start Month')) data.startMonth = w.start_month || existing.startMonth;
            if (wants('Start Year')) data.startYear = w.start_year || existing.startYear;
            if (wants('Remarks')) data.remarks = w.remarks || existing.remarks;
            if (wants('Biometrics ID')) data.biometricsId = w.biometrics_id ?? existing.biometricsId;

            if (Object.keys(data).length === 0) {
                result.skipped++;
                result.errors.push(`Worker #${w.id}: no fields selected for sync`);
                continue;
            }

            await prisma.worker.update({
                where: { id: existing.id },
                data,
            });

            result.success++;
            const syncedFields = selected ? Array.from(selected).join(', ') : 'all mapped fields';
            await logOrsSyncEvent(
                'worker_synced',
                `Synced worker #${w.id} (${w.first_name} ${w.last_name}) from ORS [fields: ${syncedFields}]`,
                String(w.id),
                `${w.first_name} ${w.last_name}`
            );
        } catch (err: any) {
            result.failed++;
            result.errors.push(`Worker #${w.id}: ${err.message}`);
        }
    }

    if (result.success > 0) revalidatePath('/workers');
    return result;
}

/**
 * Syncs legacy password hashes only (without touching Supabase Auth passwords).
 * Useful for workers with changed or missing legacy hash mapping.
 */
export async function syncOrsWorkerPasswords(
    orsWorkerIds: number[]
): Promise<ImportResult> {
    const result: ImportResult = { success: 0, skipped: 0, failed: 0, errors: [] };

    const CHUNK = 10;
    const allWorkers: any[] = [];
    for (let i = 0; i < orsWorkerIds.length; i += CHUNK) {
        const chunk = orsWorkerIds.slice(i, i + CHUNK);
        const fetched = await Promise.all(
            chunk.map(id => orsFetch<any>(`/tables/worker/${id}`).catch(() => null))
        );
        allWorkers.push(...fetched.filter(Boolean));
    }

    for (const w of allWorkers) {
        try {
            const existing = await prisma.worker.findFirst({
                where: {
                    OR: [
                        { workerId: String(w.id) },
                        ...(w.email ? [{ email: w.email }] : []),
                    ],
                },
                select: { id: true },
            });

            if (!existing) {
                result.skipped++;
                result.errors.push(`Worker #${w.id}: not found in new system`);
                continue;
            }

            const legacyPasswordHash = normalizeLegacyPasswordHash(w.password);
            await prisma.worker.update({
                where: { id: existing.id },
                data: { legacyPasswordHash },
            });
            result.success++;
            await logOrsSyncEvent(
                'password_synced',
                `Synced legacy password hash for worker #${w.id} (${w.first_name} ${w.last_name})`,
                String(w.id),
                `${w.first_name} ${w.last_name}`
            );
        } catch (err: any) {
            result.failed++;
            result.errors.push(`Worker #${w.id}: ${err.message}`);
        }
    }

    if (result.success > 0) {
        revalidatePath('/workers');
        revalidatePath('/settings/ors-sync');
    }

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

            const departmentCode = ORS_DEPT_MAP[m.department_id] || 'D';
            const headId = m.head_id ? (workerIdMap[String(m.head_id)] || null) : null;

            await prisma.ministry.create({
                data: {
                    name: m.name,
                    description: '',
                    department: {
                        connect: { code: departmentCode },
                    },
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

export async function importOrsSatellites(satellites: OrsSatellite[]): Promise<ImportResult> {
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

export async function importOrsAreas(areas: OrsArea[]): Promise<ImportResult> {
    const result: ImportResult = { success: 0, skipped: 0, failed: 0, errors: [] };

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
                data: { name: a.name, areaId: a.short_name || null, branchId: mainBranch!.id },
            });
            result.success++;
        } catch (err: any) {
            result.failed++;
            result.errors.push(`Area "${a.name}": ${err.message}`);
        }
    }
    return result;
}

// ─── C2S GROUPS & MENTEES ────────────────────────────────────────────────────

export async function previewOrsMentorGroups(
    page = 1, limit = 50
): Promise<OrsPagedResponse<OrsMentorGroup>> {
    return orsFetch(`/tables/c2s_online_group_view?page=${page}&limit=${limit}`);
}

export async function importOrsMentorGroups(groups: OrsMentorGroup[]): Promise<ImportResult> {
    const result: ImportResult = { success: 0, skipped: 0, failed: 0, errors: [] };

    const allWorkers = await prisma.worker.findMany({ select: { id: true, workerId: true } });
    const workerIdMap = Object.fromEntries(
        allWorkers.filter((w: any) => w.workerId).map((w: any) => [w.workerId, w.id])
    );

    for (const g of groups) {
        try {
            const mentorNewId = workerIdMap[String(g.mentor_id)];
            const existing = await prisma.c2SGroup.findFirst({
                where: { name: g.name, mentorId: mentorNewId || '' },
            });
            if (existing) { result.skipped++; continue; }

            await prisma.c2SGroup.create({
                data: { name: g.name, mentorId: mentorNewId || '', menteeIds: [] },
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

export async function previewOrsMentees(
    page = 1, limit = 50
): Promise<OrsPagedResponse<OrsMentee>> {
    return orsFetch(`/tables/mentee?page=${page}&limit=${limit}`);
}

export async function importOrsMentees(mentees: OrsMentee[]): Promise<ImportResult> {
    const result: ImportResult = { success: 0, skipped: 0, failed: 0, errors: [] };

    const allWorkers = await prisma.worker.findMany({
        select: { id: true, workerId: true, firstName: true, lastName: true, email: true, phone: true },
    });
    const workerByOrsId = Object.fromEntries(
        allWorkers.filter((w: any) => w.workerId).map((w: any) => [w.workerId, w])
    );

    const allGroups = await prisma.c2SGroup.findMany({ select: { id: true, mentorId: true, name: true } });
    const groupsByMentor: Record<string, typeof allGroups> = {};
    for (const g of allGroups) {
        if (!groupsByMentor[g.mentorId]) groupsByMentor[g.mentorId] = [];
        groupsByMentor[g.mentorId].push(g);
    }

    const orsGroups = await orsFetch<OrsPagedResponse<OrsMentorGroup>>('/tables/c2s_online_group_view?limit=200');
    const orsGroupMap = Object.fromEntries(orsGroups.data.map(g => [String(g.group_id || g.id), g]));

    for (const m of mentees) {
        try {
            const existing = await prisma.c2SMentee.findFirst({
                where: { email: `ors_mentee_${m.id}@legacy.ors` },
            });
            if (existing) { result.skipped++; continue; }

            const workerRec = workerByOrsId[String(m.worker_id)] as any;
            const nameParts = (m.name || '').trim().split(/\s+/);
            const firstName = workerRec?.firstName || nameParts[0] || 'Unknown';
            const lastName = workerRec?.lastName || nameParts.slice(1).join(' ') || '';
            const email = workerRec?.email || `ors_mentee_${m.id}@legacy.ors`;
            const phone = workerRec?.phone || m.contact || '';

            let groupId = '';
            let mentorId = '';
            const orsGroup = orsGroupMap[String(m.group_id)];
            if (orsGroup) {
                const mentorNewId = (workerByOrsId[String(orsGroup.mentor_id)] as any)?.id || '';
                mentorId = mentorNewId;
                const candidates = groupsByMentor[mentorNewId] || [];
                const matched = candidates.find((g: any) => g.name === orsGroup.name) || candidates[0];
                if (matched) groupId = matched.id;
            }

            if (!groupId) {
                result.skipped++;
                result.errors.push(`Mentee #${m.id} (${m.name}): no matching C2S group — import groups first`);
                continue;
            }

            await prisma.c2SMentee.create({
                data: { firstName, lastName, email, phone, status: mapStatus(m.c2s_manual_status), groupId, mentorId },
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

export async function importOrsAttendanceBatch(records: OrsAttendanceScan[]): Promise<ImportResult> {
    const result: ImportResult = { success: 0, skipped: 0, failed: 0, errors: [] };

    const allWorkers = await prisma.worker.findMany({ select: { id: true, workerId: true } });
    const workerIdMap = Object.fromEntries(
        allWorkers.filter((w: any) => w.workerId).map((w: any) => [w.workerId, w.id])
    );

    const toCreate = records
        .map(r => {
            const newWorkerId = workerIdMap[String(r.worker_id)];
            if (!newWorkerId) { result.skipped++; return null; }
            return { workerProfileId: newWorkerId, type: 'Attendance Scan', time: new Date(r.date_scanned) };
        })
        .filter(Boolean) as any[];

    if (toCreate.length > 0) {
        try {
            const inserted = await prisma.attendanceRecord.createMany({ data: toCreate, skipDuplicates: true });
            result.success = inserted.count;
        } catch (err: any) {
            result.failed = toCreate.length;
            result.errors.push(err.message);
        }
    }

    return result;
}
