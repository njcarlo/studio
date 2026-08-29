import { prisma } from '@studio/database/prisma';
import { firebaseAdminAuth } from '@/lib/firebase-admin';

const ORS_BASE = 'https://cogdasma.com/ors-reader/public';

// ─── Shared types ────────────────────────────────────────────────────────────

export type OrsPagedResponse<T> = {
    data: T[];
    meta: { total: number; page: number; limit: number; totalPages: number };
};

// The legacy ORS reader API itself returns a FLAT paging envelope — NOT the
// nested `meta` shape above (which is this module's own UI-facing pagination
// type, e.g. `getWorkerDiffPage`). Raw API responses look like:
// `{ table, page, limit, total, pages, data }`. Mixing these up is what broke
// ORS sync (every `.meta.total`/`.meta.totalPages` access on a raw API
// response threw `TypeError: Cannot read properties of undefined`).
type OrsApiPage<T> = {
    data: T[];
    page: number;
    limit: number;
    total: number;
    pages: number;
};

export type ImportResult = {
    success: number;
    skipped: number;
    failed: number;
    errors: string[];
};

// ─── Sync run tracking ───────────────────────────────────────────────────────

/** Which slice of ORS a run touched. Persisted verbatim in `OrsSyncRun.scope`. */
export type OrsSyncScope =
    | 'workers_import'
    | 'workers_sync'
    | 'workers_passwords'
    | 'ministries'
    | 'branches'
    | 'areas'
    | 'c2s_groups'
    | 'mentees'
    | 'attendance'
    | 'weekly_full';

export type OrsSyncTrigger = 'manual' | 'scheduled';

export type OrsSyncRunStatus = 'running' | 'success' | 'failed';

/** Who/what started a run. Actions fill this from `requirePermission`. */
export type OrsSyncRunContext = {
    trigger?: OrsSyncTrigger;
    actorId?: string | null;
    actorName?: string | null;
};

export type OrsSyncRunRecord = {
    id: string;
    scope: OrsSyncScope | string;
    trigger: OrsSyncTrigger | string;
    status: OrsSyncRunStatus | string;
    startedAt: Date;
    finishedAt: Date | null;
    succeeded: number;
    skipped: number;
    failed: number;
    errors: string[];
    message: string | null;
    startedById: string | null;
    startedByName: string | null;
};

/**
 * A run still marked `running` after this long is treated as abandoned — the
 * serverless instance that owned it was almost certainly recycled mid-import.
 * ORS imports are chunked network loops over tens of thousands of rows, so this
 * is deliberately generous; it only needs to be longer than the slowest real
 * run, not tight.
 */
const STALE_RUN_MS = 30 * 60 * 1000;

/** Caps `OrsSyncRun.errors` so one pathological batch can't write a huge row. */
const MAX_STORED_ERRORS = 50;

export type OrsSyncStatusSummary = {
    /** True only while a run is genuinely in flight (not a stale/abandoned row). */
    isRunning: boolean;
    /** The in-flight run, if any. */
    current: OrsSyncRunRecord | null;
    /** Most recent finished run (success or failed), regardless of scope. */
    lastCompleted: OrsSyncRunRecord | null;
    /** Runs left `running` past STALE_RUN_MS — surfaced so operators can see them. */
    stale: OrsSyncRunRecord[];
    /** Recent history, newest first. */
    recent: OrsSyncRunRecord[];
    /** When the weekly scheduled job last finished successfully. */
    lastScheduledAt: Date | null;
};

function isStaleRun(run: { status: string; startedAt: Date }): boolean {
    return run.status === 'running' && Date.now() - run.startedAt.getTime() > STALE_RUN_MS;
}

/**
 * Wraps a mutating ORS operation in a durable `OrsSyncRun` record: writes a
 * `running` row before the work starts, then stamps `finishedAt` plus the
 * result counts when it settles.
 *
 * Deliberately does NOT refuse to start when another run is in flight — the
 * tabs import disjoint entity types and blocking them against each other would
 * be a regression for operators. The one place overlap actually matters is the
 * weekly job, which takes an explicit lock via `hasRunningScope` before doing
 * anything.
 *
 * The bookkeeping is best-effort: if the DB write for the run record itself
 * fails, the import still runs. Losing an audit row must never cost an import.
 */
async function withSyncRun<T extends ImportResult>(
    scope: OrsSyncScope,
    ctx: OrsSyncRunContext | undefined,
    fn: () => Promise<T>,
): Promise<T> {
    let runId: string | null = null;
    try {
        const run = await prisma.orsSyncRun.create({
            data: {
                scope,
                trigger: ctx?.trigger ?? 'manual',
                status: 'running',
                startedById: ctx?.actorId ?? null,
                startedByName: ctx?.actorName ?? null,
            },
            select: { id: true },
        });
        runId = run.id;
    } catch {
        // Run tracking is observability, not a precondition for the import.
    }

    try {
        const result = await fn();
        if (runId) await finishRun(runId, 'success', result);
        return result;
    } catch (err: any) {
        if (runId) {
            await finishRun(runId, 'failed', { success: 0, skipped: 0, failed: 0, errors: [] }, err?.message ?? String(err));
        }
        throw err;
    }
}

async function finishRun(
    runId: string,
    status: OrsSyncRunStatus,
    result: ImportResult,
    message?: string,
): Promise<void> {
    try {
        await prisma.orsSyncRun.update({
            where: { id: runId },
            data: {
                status,
                finishedAt: new Date(),
                succeeded: result.success,
                skipped: result.skipped,
                failed: result.failed,
                errors: result.errors.slice(0, MAX_STORED_ERRORS),
                message: message ?? null,
            },
        });
    } catch {
        // See withSyncRun — never let bookkeeping failures surface as import failures.
    }
}

/** True if a non-stale run for `scope` is currently in flight. */
async function hasRunningScope(scope: OrsSyncScope): Promise<boolean> {
    const running = await prisma.orsSyncRun.findFirst({
        where: { scope, status: 'running' },
        orderBy: { startedAt: 'desc' },
        select: { status: true, startedAt: true },
    });
    return !!running && !isStaleRun(running);
}

/**
 * The page-facing answer to "is the ORS sync still running?". Reads only the
 * run table — no ORS network calls — so it stays fast enough to poll.
 */
export async function getOrsSyncStatus(limit = 10): Promise<OrsSyncStatusSummary> {
    const [runningRuns, lastCompleted, recent, lastScheduled] = await Promise.all([
        prisma.orsSyncRun.findMany({
            where: { status: 'running' },
            orderBy: { startedAt: 'desc' },
        }),
        prisma.orsSyncRun.findFirst({
            where: { status: { in: ['success', 'failed'] } },
            orderBy: { startedAt: 'desc' },
        }),
        prisma.orsSyncRun.findMany({
            orderBy: { startedAt: 'desc' },
            take: limit,
        }),
        prisma.orsSyncRun.findFirst({
            where: { trigger: 'scheduled', status: 'success' },
            orderBy: { startedAt: 'desc' },
            select: { finishedAt: true },
        }),
    ]);

    const live = (runningRuns as OrsSyncRunRecord[]).filter((r) => !isStaleRun(r));
    const stale = (runningRuns as OrsSyncRunRecord[]).filter((r) => isStaleRun(r));

    return {
        isRunning: live.length > 0,
        current: live[0] ?? null,
        lastCompleted: (lastCompleted as OrsSyncRunRecord | null) ?? null,
        stale,
        recent: recent as OrsSyncRunRecord[],
        lastScheduledAt: lastScheduled?.finishedAt ?? null,
    };
}

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

/** Canonical department names per code — mirrors `normalizeDepartmentCode` in actions/db.ts. */
const DEPT_NAMES: Record<string, string> = {
    W: 'Worship',
    O: 'Outreach',
    R: 'Relationship',
    D: 'Discipleship',
    A: 'Administration',
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

    if (existing.workerId !== null && existing.workerId !== String(ors.id)) {
        diffs.push({ label: 'Worker ID', ors: String(ors.id), current: existing.workerId });
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

/**
 * Single-row ORS reads (`/tables/<table>/<id>`) answer with a *nested* envelope
 * — `{ table, data: {...} }` — unlike the list endpoints' flat `OrsApiPage`.
 * Reading fields straight off the response therefore yields `undefined` for
 * every column, which is silent: the importer happily wrote one row with
 * `workerId: "undefined"` and then treated every later worker as already
 * present, so no worker could ever be imported again.
 */
type OrsApiRow<T> = { table: string; data: T };

async function orsFetchRow<T>(path: string): Promise<T> {
    const body = await orsFetch<OrsApiRow<T> | T>(path);
    const row = (body as OrsApiRow<T>)?.data ?? (body as T);
    if (!row || typeof row !== 'object') {
        throw new Error(`ORS row fetch returned no data: ${path}`);
    }
    return row as T;
}

/**
 * ORS caps `limit` at 100 regardless of what is asked for, and reports the
 * resulting page count in `pages`. Always follow `pages` rather than assuming
 * one big request returned everything — a single `?limit=200` silently
 * truncated the 1,739-row C2S group view to its first 100 rows.
 */
async function fetchAllOrsRows<T>(table: string): Promise<T[]> {
    const first = await orsFetch<OrsApiPage<T>>(`/tables/${table}?page=1&limit=100`);
    const all = [...first.data];
    for (let page = 2; page <= first.pages; page++) {
        const res = await orsFetch<OrsApiPage<T>>(`/tables/${table}?page=${page}&limit=100`);
        all.push(...res.data);
    }
    return all;
}

async function fetchAllOrsWorkerIds(): Promise<Set<string>> {
    const limit = 500;
    const first = await orsFetch<OrsApiPage<{ id: number }>>(`/tables/worker?page=1&limit=${limit}`);
    const all = new Set<string>(first.data.map((w) => String(w.id)));

    for (let page = 2; page <= first.pages; page++) {
        const res = await orsFetch<OrsApiPage<{ id: number }>>(`/tables/worker?page=${page}&limit=${limit}`);
        for (const w of res.data) all.add(String(w.id));
    }

    return all;
}

async function fetchAllOrsWorkers(): Promise<any[]> {
    const limit = 500;
    const first = await orsFetch<OrsApiPage<any>>(`/tables/worker?page=1&limit=${limit}`);
    const all = [...first.data];

    for (let page = 2; page <= first.pages; page++) {
        const res = await orsFetch<OrsApiPage<any>>(`/tables/worker?page=${page}&limit=${limit}`);
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

/**
 * Persists a single batch-level audit record summarizing an entire
 * import/sync run — addresses ORS-sync hardening finding #6 ("no batch-level
 * audit record beyond per-row errors").
 *
 * Deliberately NOT a `prisma.$transaction` wrapper around the whole batch:
 * these loops are designed to be partially-recoverable (re-running skips
 * already-processed rows), so an all-or-nothing transaction would change that
 * recovery model rather than harden it. A summary row gives operators a single
 * place to see "did this batch run cleanly" without losing per-row resilience.
 */
async function logBatchSummary(action: string, label: string, result: ImportResult) {
    const details = `${label}: ${result.success} succeeded, ${result.skipped} skipped, ${result.failed} failed` +
        (result.errors.length > 0 ? `. Errors: ${result.errors.join('; ')}` : '');
    await logOrsSyncEvent(action, details);
}

/**
 * Repoints the Firebase Auth account from `oldEmail` to `newEmail` so an ORS
 * email change doesn't orphan the worker's login. Refuses to proceed if
 * `newEmail` already belongs to a different auth user (collision), or if no
 * auth user exists yet for `oldEmail` (nothing to repoint — the Prisma email
 * write would otherwise desync from `legacy-auth.ts`'s lookup-by-email).
 * Returns true only when it's safe for the caller to also update Prisma.
 */
async function syncFirebaseAuthEmail(oldEmail: string, newEmail: string): Promise<boolean> {
    try {
        const collision = await firebaseAdminAuth.getUserByEmail(newEmail).catch(() => null);
        if (collision) return false;

        const authUser = await firebaseAdminAuth.getUserByEmail(oldEmail).catch(() => null);
        if (!authUser) return false;

        await firebaseAdminAuth.updateUser(authUser.uid, { email: newEmail, emailVerified: true });
        return true;
    } catch {
        return false;
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
        orsFetch<OrsApiPage<any>>('/tables/worker?page=1&limit=1'),
        orsFetch<OrsApiPage<any>>('/tables/ministry?page=1&limit=1'),
        orsFetch<OrsApiPage<any>>('/tables/satellite?page=1&limit=1'),
        orsFetch<OrsApiPage<any>>('/tables/area?page=1&limit=1'),
        orsFetch<OrsApiPage<any>>('/tables/c2s_online_group_view?page=1&limit=1'),
        orsFetch<OrsApiPage<any>>('/tables/mentee?page=1&limit=1'),
        orsFetch<OrsApiPage<any>>('/tables/hr_attendance_scan?page=1&limit=1'),
        prisma.worker.count({ where: { workerId: { not: null } } }),
        prisma.ministry.count(),
        prisma.branch.count(),
        prisma.area.count(),
        prisma.c2SGroup.count(),
        prisma.c2SMentee.count(),
        prisma.attendanceRecord.count(),
    ]);

    return {
        workers:    { total: orsWorkers.total,    imported: impWorkers },
        ministries: { total: orsMinistries.total, imported: impMinistries },
        branches:   { total: orsSatellites.total, imported: impBranches },
        areas:      { total: orsAreas.total,      imported: impAreas },
        c2sGroups:  { total: orsGroups.total,     imported: impGroups },
        mentees:    { total: orsMentees.total,    imported: impMentees },
        attendance: { total: orsAttendance.total, imported: impAttendance },
    };
}

// ─── Ministry map (ORS id → new app id, matched by name) ────────────────────

export async function getOrsMinistryMap(): Promise<Record<string, string>> {
    const [orsMinistries, newMinistries] = await Promise.all([
        fetchAllOrsRows<OrsMinistry>('ministry'),
        prisma.ministry.findMany(),
    ]);
    const map: Record<string, string> = {};
    for (const orsMin of orsMinistries) {
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
            const apiRes = await orsFetch<OrsApiPage<any>>(path);
            orsWorkers = apiRes.data;
            orsRes = {
                data: apiRes.data,
                meta: { total: apiRes.total, page: apiRes.page, limit: apiRes.limit, totalPages: apiRes.pages },
            };
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
                id: true, workerId: true, legacyPasswordHash: true, firstName: true, lastName: true,
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
                    (w.workerId || '').toLowerCase().includes(q)
                );
            })
            : baseOrphans);

        const start = (page - 1) * limit;
        const slice = filteredOrphans.slice(start, start + limit);

        slice.forEach((w, idx) => {
            const stableId = Number(w.workerId) || -(start + idx + 1);
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
 * Imports NEW workers from ORS into the new app — DB only, no Supabase Auth.
 * Workers log in via Worker ID on the login page, which creates their
 * Supabase Auth account on first login using the legacy password flow.
 */
export async function importOrsNewWorkers(
    orsWorkerIds: number[],
    options: {
        defaultRoleId: string;
        ministryIdMap: Record<string, string>;
        migratePasswordHash: boolean;
    },
    ctx?: OrsSyncRunContext
): Promise<ImportResult> {
    return withSyncRun('workers_import', ctx, () => importOrsNewWorkersInner(orsWorkerIds, options));
}

async function importOrsNewWorkersInner(
    orsWorkerIds: number[],
    options: {
        defaultRoleId: string;
        ministryIdMap: Record<string, string>;
        migratePasswordHash: boolean;
    }
): Promise<ImportResult> {
    const { defaultRoleId, ministryIdMap, migratePasswordHash } = options;
    const result: ImportResult = { success: 0, skipped: 0, failed: 0, errors: [] };

    // Re-fetch workers from ORS server-side (includes password hash)
    const CHUNK = 10;
    const allWorkers: any[] = [];
    for (let i = 0; i < orsWorkerIds.length; i += CHUNK) {
        const chunk = orsWorkerIds.slice(i, i + CHUNK);
        const fetched = await Promise.all(
            chunk.map(id => orsFetchRow<any>(`/tables/worker/${id}`).catch(() => null))
        );
        allWorkers.push(...fetched.filter(Boolean));
    }

    if (!['viewer', 'worker'].includes(defaultRoleId)) {
        throw new Error(`Invalid default role ID: ${defaultRoleId}`);
    }

    for (const w of allWorkers) {
        try {
            // A row without an ORS id can only produce a junk record whose
            // `workerId` then matches every subsequent lookup, wedging all
            // later imports. Refuse it loudly instead.
            const orsId = w?.id != null ? String(w.id).trim() : '';
            if (!orsId || orsId === 'undefined' || orsId === 'null') {
                result.failed++;
                result.errors.push('Skipped an ORS row with no usable worker id');
                continue;
            }

            // Skip workers already in the DB
            const existingWorker = await prisma.worker.findFirst({
                where: { OR: [{ workerId: orsId }, ...(w.email ? [{ email: w.email }] : [])] },
            });
            if (existingWorker) {
                result.skipped++;
                continue;
            }

            const majorMinistryId = w.ministry_id ? (ministryIdMap[String(w.ministry_id)] || '') : '';
            const minorMinistryId = w.sec_ministry_id ? (ministryIdMap[String(w.sec_ministry_id)] || '') : '';
            const legacyPasswordHash = migratePasswordHash ? normalizeLegacyPasswordHash(w.password) : null;

            // Generate a UUID for the worker — Supabase Auth account created on first login
            const uid = crypto.randomUUID();

            await prisma.worker.create({
                data: {
                    id: uid,
                    workerId: String(w.id),
                    legacyPasswordHash,
                    firstName: w.first_name || '',
                    lastName: w.last_name || '',
                    email: w.email || `worker_${w.id}@noemail.local`,
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
                    passwordChangeRequired: true,
                    qrToken: w.qrdata || null,
                },
            });

            result.success++;
            await logOrsSyncEvent(
                'worker_imported',
                `Imported worker #${w.id} (${w.first_name} ${w.last_name}) from ORS (DB only)`,
                String(w.id),
                `${w.first_name} ${w.last_name}`
            );
        } catch (err: any) {
            result.failed++;
            result.errors.push(`Worker #${w.id}: ${err.message}`);
        }
    }

    await logBatchSummary('batch_import_completed', 'New worker import', result);
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
    ministryIdMap: Record<string, string> = {},
    ctx?: OrsSyncRunContext
): Promise<ImportResult> {
    return withSyncRun('workers_sync', ctx, () => syncOrsUpdatedWorkersInner(workers, ministryIdMap));
}

async function syncOrsUpdatedWorkersInner(
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

            // Skip if local record was updated more recently than the legacy record
            // Since ORS doesn't provide an updatedAt, we assume if our local record
            // was updated within the last day, we shouldn't clobber it blindly.
            // Ideally we'd compare ORS timestamp, but ORS doesn't give us one.
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            if (existing.updatedAt > oneDayAgo) {
                result.skipped++;
                result.errors.push(`Worker #${w.id}: skipped because local record was recently updated`);
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
            }
            if (wants('First Name')) data.firstName = w.first_name || existing.firstName;
            if (wants('Last Name')) data.lastName = w.last_name || existing.lastName;
            if (wants('Email') && w.email && w.email !== existing.email) {
                const emailUpdated = await syncFirebaseAuthEmail(existing.email, w.email);
                if (emailUpdated) {
                    data.email = w.email;
                } else {
                    result.errors.push(`Worker #${w.id}: skipped email change (${existing.email} -> ${w.email}) — could not update Supabase Auth linkage`);
                }
            }
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

    await logBatchSummary('batch_sync_completed', 'Worker field sync', result);
    return result;
}

/**
 * Syncs legacy password hashes only (without touching Supabase Auth passwords).
 * Useful for workers with changed or missing legacy hash mapping.
 */
export async function syncOrsWorkerPasswords(
    orsWorkerIds: number[],
    ctx?: OrsSyncRunContext
): Promise<ImportResult> {
    return withSyncRun('workers_passwords', ctx, () => syncOrsWorkerPasswordsInner(orsWorkerIds));
}

async function syncOrsWorkerPasswordsInner(
    orsWorkerIds: number[]
): Promise<ImportResult> {
    const result: ImportResult = { success: 0, skipped: 0, failed: 0, errors: [] };

    const CHUNK = 10;
    const allWorkers: any[] = [];
    for (let i = 0; i < orsWorkerIds.length; i += CHUNK) {
        const chunk = orsWorkerIds.slice(i, i + CHUNK);
        const fetched = await Promise.all(
            chunk.map(id => orsFetchRow<any>(`/tables/worker/${id}`).catch(() => null))
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
                select: { id: true, legacyMigratedAt: true, passwordChangeRequired: true },
            });

            if (!existing) {
                result.skipped++;
                result.errors.push(`Worker #${w.id}: not found in new system`);
                continue;
            }

            if (existing.legacyMigratedAt || existing.passwordChangeRequired === false) {
                result.skipped++;
                result.errors.push(`Worker #${w.id}: already migrated, skipping password hash sync`);
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

    return result;
}

// ─── MINISTRIES ──────────────────────────────────────────────────────────────

export async function previewOrsMinistries(
    page = 1, limit = 50
): Promise<OrsPagedResponse<OrsMinistry>> {
    return orsFetch(`/tables/ministry?page=${page}&limit=${limit}`);
}

export async function importOrsMinistries(
    ministries: OrsMinistry[],
    ctx?: OrsSyncRunContext
): Promise<ImportResult> {
    return withSyncRun('ministries', ctx, () => importOrsMinistriesInner(ministries));
}

async function importOrsMinistriesInner(
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

            // Nothing in the repo seeds `Department`, so on a fresh database a
            // bare `connect` failed for every ministry. Ensure the row exists.
            await prisma.department.upsert({
                where: { code: departmentCode },
                update: {},
                create: {
                    code: departmentCode,
                    name: DEPT_NAMES[departmentCode] ?? departmentCode,
                    weight: 0,
                },
            });

            await prisma.ministry.create({
                data: {
                    name: m.name,
                    description: '',
                    department: {
                        connect: { code: departmentCode },
                    },
                    // `Ministry.leaderId` is a required column and most ORS
                    // ministries have no resolvable head, so `null` rejected
                    // every single ministry. '' is the app's "unset" value
                    // (see the ministries form).
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

export async function importOrsSatellites(satellites: OrsSatellite[], ctx?: OrsSyncRunContext): Promise<ImportResult> {
    return withSyncRun('branches', ctx, () => importOrsSatellitesInner(satellites));
}

async function importOrsSatellitesInner(satellites: OrsSatellite[]): Promise<ImportResult> {
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

export async function importOrsAreas(areas: OrsArea[], ctx?: OrsSyncRunContext): Promise<ImportResult> {
    return withSyncRun('areas', ctx, () => importOrsAreasInner(areas));
}

async function importOrsAreasInner(areas: OrsArea[]): Promise<ImportResult> {
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

export async function importOrsMentorGroups(groups: OrsMentorGroup[], ctx?: OrsSyncRunContext): Promise<ImportResult> {
    return withSyncRun('c2s_groups', ctx, () => importOrsMentorGroupsInner(groups));
}

async function importOrsMentorGroupsInner(groups: OrsMentorGroup[]): Promise<ImportResult> {
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

    return result;
}

export async function previewOrsMentees(
    page = 1, limit = 50
): Promise<OrsPagedResponse<OrsMentee>> {
    return orsFetch(`/tables/mentee?page=${page}&limit=${limit}`);
}

export async function importOrsMentees(mentees: OrsMentee[], ctx?: OrsSyncRunContext): Promise<ImportResult> {
    return withSyncRun('mentees', ctx, () => importOrsMenteesInner(mentees));
}

async function importOrsMenteesInner(mentees: OrsMentee[]): Promise<ImportResult> {
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

    const orsGroups = await fetchAllOrsRows<OrsMentorGroup>('c2s_online_group_view');
    const orsGroupMap = Object.fromEntries(orsGroups.map(g => [String(g.group_id || g.id), g]));

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

    return result;
}

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────

export async function previewOrsAttendance(
    page = 1, limit = 50
): Promise<OrsPagedResponse<OrsAttendanceScan>> {
    return orsFetch(`/tables/hr_attendance_scan?page=${page}&limit=${limit}`);
}

export async function importOrsAttendanceBatch(records: OrsAttendanceScan[], ctx?: OrsSyncRunContext): Promise<ImportResult> {
    return withSyncRun('attendance', ctx, () => importOrsAttendanceBatchInner(records));
}

async function importOrsAttendanceBatchInner(records: OrsAttendanceScan[]): Promise<ImportResult> {
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

// ─── WEEKLY SCHEDULED SYNC ───────────────────────────────────────────────────

/**
 * Counts of the worker diff without paging — how many ORS workers are new,
 * changed, or already in step with the new system. The weekly job records this
 * so operators can see "12 new workers waiting for review" without opening the
 * Workers tab and paging through it.
 */
export type WorkerDiffSummary = {
    new: number;
    updated: number;
    synced: number;
    orphan: number;
};

/**
 * One full pass over ORS + local workers, indexed for matching. Both the diff
 * summary and the weekly new-worker pick-up need exactly this, and it's the
 * expensive part (it pages the entire legacy worker table), so they share it.
 */
async function loadWorkerDiffIndex() {
    const [orsWorkers, localWorkers] = await Promise.all([
        fetchAllOrsWorkers(),
        prisma.worker.findMany({
            select: {
                id: true, workerId: true, legacyPasswordHash: true, firstName: true, lastName: true,
                email: true, phone: true, address: true, birthDate: true, startMonth: true,
                startYear: true, remarks: true, biometricsId: true, qrToken: true, status: true,
                majorMinistryId: true, minorMinistryId: true, employmentType: true, roleId: true,
            },
        }),
    ]);

    const byWorkerId = new Map<string, ExistingWorkerSummary>();
    const byEmail = new Map<string, ExistingWorkerSummary>();
    for (const w of localWorkers as unknown as ExistingWorkerSummary[]) {
        if (w.workerId) byWorkerId.set(String(w.workerId), w);
        if (w.email) byEmail.set(w.email, w);
    }

    const matchLocal = (orsWorker: any): ExistingWorkerSummary | undefined =>
        byWorkerId.get(String(orsWorker.id)) ||
        (orsWorker.email ? byEmail.get(orsWorker.email) : undefined);

    return { orsWorkers, localWorkers, matchLocal };
}

type WorkerDiffIndex = Awaited<ReturnType<typeof loadWorkerDiffIndex>>;

/**
 * ORS worker IDs with no counterpart in the new system, oldest ORS ID first.
 *
 * Scans the WHOLE legacy worker table rather than the first page of the diff:
 * new workers are appended at the end of ORS, so a page-1 view would routinely
 * miss exactly the rows this is meant to find.
 */
export function collectNewOrsWorkerIdsFromIndex(
    { orsWorkers, matchLocal }: Pick<WorkerDiffIndex, 'orsWorkers' | 'matchLocal'>,
): number[] {
    return orsWorkers
        .filter((w) => !matchLocal(w))
        .map((w) => Number(w.id))
        .filter((id) => Number.isFinite(id))
        .sort((a, b) => a - b);
}

/**
 * Existing workers whose ORS fields have drifted, from a full-table index.
 *
 * Same page-1 trap as new-worker collection: `getWorkerDiffPage(1, 500)` only
 * sees the first page of the ORS worker table, so updates later in the table
 * would never be pushed. The weekly `all` mode has to scan the whole index.
 */
export function collectUpdatedWorkersFromIndex(
    { orsWorkers, matchLocal }: Pick<WorkerDiffIndex, 'orsWorkers' | 'matchLocal'>,
    ministryMap: Record<string, string>,
): SyncUpdatedWorkerInput[] {
    const updated: SyncUpdatedWorkerInput[] = [];
    for (const worker of orsWorkers) {
        const existing = matchLocal(worker);
        if (!existing) continue;
        const fields = computeDiffFields(worker, existing, ministryMap);
        if (fields.length > 0) {
            updated.push({ worker, fields: fields.map((f) => f.label) });
        }
    }
    return updated;
}

function summarizeFromIndex(
    { orsWorkers, localWorkers, matchLocal }: WorkerDiffIndex,
    ministryMap: Record<string, string>,
): WorkerDiffSummary {
    const summary: WorkerDiffSummary = { new: 0, updated: 0, synced: 0, orphan: 0 };
    const orsIds = new Set(orsWorkers.map((w) => String(w.id)));

    for (const orsWorker of orsWorkers) {
        const existing = matchLocal(orsWorker);
        if (!existing) {
            summary.new++;
        } else if (computeDiffFields(orsWorker, existing, ministryMap).length > 0) {
            summary.updated++;
        } else {
            summary.synced++;
        }
    }

    for (const w of localWorkers) {
        if (!w.workerId || !orsIds.has(String(w.workerId))) summary.orphan++;
    }

    return summary;
}

export async function computeWorkerDiffSummary(
    ministryMap: Record<string, string> = {}
): Promise<WorkerDiffSummary> {
    return summarizeFromIndex(await loadWorkerDiffIndex(), ministryMap);
}

/**
 * What the weekly job is allowed to do with workers:
 *
 *   "new"  — import ORS workers that don't exist here yet (default). Additive:
 *            it only ever creates records, and `importOrsNewWorkersInner` skips
 *            any ORS row that already matches by worker ID or email.
 *   "all"  — also push ORS field changes onto existing workers. This OVERWRITES
 *            live PII (name, email, phone, address, ministry…) from the legacy
 *            system, so it stays opt-in; the sync page gates it behind
 *            field-by-field review for a reason.
 *   "none" — touch no worker records at all; just report the diff.
 *
 * `ORS_WEEKLY_INCLUDE_WORKERS=true` is still honoured as the old spelling of
 * "all" so an already-deployed environment doesn't silently lose behaviour.
 */
export type WeeklyWorkerMode = 'none' | 'new' | 'all';

export function weeklyWorkerMode(): WeeklyWorkerMode {
    const raw = (process.env.ORS_WEEKLY_WORKERS || '').trim().toLowerCase();
    if (raw === 'none' || raw === 'new' || raw === 'all') return raw;
    if (process.env.ORS_WEEKLY_INCLUDE_WORKERS === 'true') return 'all';
    return 'new';
}

/**
 * Role assigned to workers the weekly job imports. Restricted to the same two
 * roles the manual import allows — `importOrsNewWorkersInner` throws on
 * anything else, and a cron job must not be able to mint privileged accounts
 * via a typo in an env var.
 */
function weeklyDefaultRoleId(): string {
    const raw = (process.env.ORS_WEEKLY_WORKER_ROLE || '').trim().toLowerCase();
    return raw === 'worker' ? 'worker' : 'viewer';
}

/**
 * Ceiling on how many new workers one weekly run imports. Each import is a
 * per-row ORS fetch plus an insert, and the cron route has a finite budget —
 * a first run against a large backlog would otherwise blow through it and be
 * killed mid-way. The remainder is picked up next week (or by a manual import),
 * and the run message says how many were left.
 */
const WEEKLY_NEW_WORKER_LIMIT = 250;

function weeklyNewWorkerLimit(): number {
    const parsed = Number(process.env.ORS_WEEKLY_WORKER_LIMIT);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : WEEKLY_NEW_WORKER_LIMIT;
}

export type WeeklyOrsSyncResult = ImportResult & {
    skippedReason?: string;
    diff?: WorkerDiffSummary;
};

/**
 * The once-a-week ORS refresh, invoked by `/api/cron/ors-weekly-sync`.
 *
 * Scope is intentionally narrow — reference data only (ministries, branches,
 * areas), which is additive, name-matched, and idempotent (every importer skips
 * rows that already exist). On top of that it records a worker diff summary so
 * the sync page can show how much is waiting for review.
 *
 * Worker handling is governed by `weeklyWorkerMode()`: by default the run adds
 * ORS workers that are missing here, and leaves existing records alone. Field
 * changes on already-imported workers are only pushed when the mode is "all",
 * since that overwrites live PII.
 *
 * The one thing it never does is attendance. `AttendanceRecord` has no unique
 * constraint on (workerProfileId, time), so `createMany({ skipDuplicates: true })`
 * cannot actually dedupe scans; re-importing weekly would multiply every row.
 * Attendance stays manual until that constraint exists.
 */
export async function runWeeklyOrsSync(): Promise<WeeklyOrsSyncResult> {
    // Single-flight: never stack a scheduled run on top of one still going.
    if (await hasRunningScope('weekly_full')) {
        return {
            success: 0, skipped: 0, failed: 0, errors: [],
            skippedReason: 'A weekly ORS sync is already running',
        };
    }

    return withSyncRun('weekly_full', { trigger: 'scheduled', actorName: 'Scheduled job' }, async () => {
        const total: WeeklyOrsSyncResult = { success: 0, skipped: 0, failed: 0, errors: [] };
        const parts: string[] = [];

        const add = (label: string, r: ImportResult) => {
            total.success += r.success;
            total.skipped += r.skipped;
            total.failed += r.failed;
            total.errors.push(...r.errors.map((e) => `${label}: ${e}`));
            parts.push(`${label} ${r.success}/${r.skipped}/${r.failed}`);
        };

        // Reference data, in the same order the UI recommends.
        add('ministries', await importOrsMinistriesInner(await fetchAllOrsRows<OrsMinistry>('ministry')));
        add('branches', await importOrsSatellitesInner(await fetchAllOrsRows<OrsSatellite>('satellite')));
        add('areas', await importOrsAreasInner(await fetchAllOrsRows<OrsArea>('area')));

        const ministryMap = await getOrsMinistryMap();

        const mode = weeklyWorkerMode();
        parts.push(`worker mode: ${mode}`);

        // One full-table index for new-worker pickup, field updates, and the
        // pending-review summary. Each of those used to page ORS independently.
        let index: WorkerDiffIndex | null = null;
        const getIndex = async () => {
            if (!index) index = await loadWorkerDiffIndex();
            return index;
        };

        if (mode !== 'none') {
            const newIds = collectNewOrsWorkerIdsFromIndex(await getIndex());
            const limit = weeklyNewWorkerLimit();
            const batch = newIds.slice(0, limit);

            if (batch.length > 0) {
                add('workers_new', await importOrsNewWorkersInner(batch, {
                    defaultRoleId: weeklyDefaultRoleId(),
                    ministryIdMap: ministryMap,
                    migratePasswordHash: true,
                }));
            }
            if (newIds.length > batch.length) {
                parts.push(`${newIds.length - batch.length} new worker(s) deferred to next run (limit ${limit})`);
            }
        }

        if (mode === 'all') {
            const updated = collectUpdatedWorkersFromIndex(await getIndex(), ministryMap);
            const limit = weeklyNewWorkerLimit();
            const batch = updated.slice(0, limit);
            if (batch.length > 0) {
                add('workers_updated', await syncOrsUpdatedWorkersInner(batch, ministryMap));
            }
            if (updated.length > batch.length) {
                parts.push(`${updated.length - batch.length} updated worker(s) deferred to next run (limit ${limit})`);
            }
        }

        try {
            total.diff = summarizeFromIndex(await getIndex(), ministryMap);
            parts.push(
                `pending review: ${total.diff.new} new, ${total.diff.updated} updated, ${total.diff.orphan} orphan`
            );
        } catch (err: any) {
            total.errors.push(`diff summary: ${err.message}`);
        }

        await logOrsSyncEvent(
            'weekly_sync_completed',
            `Weekly ORS sync — ${parts.join('; ')} (counts are success/skipped/failed)`
        );

        return total;
    });
}
