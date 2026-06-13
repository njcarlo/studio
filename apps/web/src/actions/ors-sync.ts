"use server";

import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@/lib/permissions/registry';
import * as orsSyncService from '@/services/ors-sync';
import {
    importOrsNewWorkersOptionsSchema,
    syncUpdatedWorkerItemSchema,
} from '@/lib/schemas/ors-sync.schemas';

// `export type {...} from '...'` re-export syntax is rejected by Next's
// "use server" transform ("Only async functions are allowed to be exported in
// a 'use server' file") — import as types and re-export local aliases instead.
import type {
    OrsPagedResponse as _OrsPagedResponse,
    ImportResult as _ImportResult,
    OrsWorker as _OrsWorker,
    OrsMinistry as _OrsMinistry,
    OrsArea as _OrsArea,
    OrsSatellite as _OrsSatellite,
    OrsMentorGroup as _OrsMentorGroup,
    OrsMentee as _OrsMentee,
    OrsAttendanceScan as _OrsAttendanceScan,
    HashType as _HashType,
    WorkerSyncStatus as _WorkerSyncStatus,
    WorkerSyncDirection as _WorkerSyncDirection,
    PasswordSyncStatus as _PasswordSyncStatus,
    ExistingWorkerSummary as _ExistingWorkerSummary,
    WorkerDiffRecord as _WorkerDiffRecord,
    DiffField as _DiffField,
    SyncUpdatedWorkerInput as _SyncUpdatedWorkerInput,
    OrsSyncStats as _OrsSyncStats,
} from '@/services/ors-sync';

export type OrsPagedResponse<T> = _OrsPagedResponse<T>;
export type ImportResult = _ImportResult;
export type OrsWorker = _OrsWorker;
export type OrsMinistry = _OrsMinistry;
export type OrsArea = _OrsArea;
export type OrsSatellite = _OrsSatellite;
export type OrsMentorGroup = _OrsMentorGroup;
export type OrsMentee = _OrsMentee;
export type OrsAttendanceScan = _OrsAttendanceScan;
export type HashType = _HashType;
export type WorkerSyncStatus = _WorkerSyncStatus;
export type WorkerSyncDirection = _WorkerSyncDirection;
export type PasswordSyncStatus = _PasswordSyncStatus;
export type ExistingWorkerSummary = _ExistingWorkerSummary;
export type WorkerDiffRecord = _WorkerDiffRecord;
export type DiffField = _DiffField;
export type SyncUpdatedWorkerInput = _SyncUpdatedWorkerInput;
export type OrsSyncStats = _OrsSyncStats;

const ORS_SYNC_PERMISSION = PERMISSIONS.system.manage_ors_sync;

// All ORS sync actions touch legacy worker PII and can mint or overwrite
// accounts in bulk — every export (including read-only previews) requires
// the same domain permission server-side, regardless of UI gating.
async function assertCanManageOrsSync() {
    await requirePermission(ORS_SYNC_PERMISSION);
}

// ─── Overview / lookups ──────────────────────────────────────────────────────

export async function getOrsSyncStats(): Promise<OrsSyncStats> {
    await assertCanManageOrsSync();
    return orsSyncService.getOrsSyncStats();
}

export async function getOrsMinistryMap(): Promise<Record<string, string>> {
    await assertCanManageOrsSync();
    return orsSyncService.getOrsMinistryMap();
}

// ─── Worker diff ─────────────────────────────────────────────────────────────

export async function getWorkerDiffPage(
    page = 1,
    limit = 50,
    search?: string,
    ministryMap: Record<string, string> = {},
    direction: WorkerSyncDirection | 'all' = 'all'
): Promise<OrsPagedResponse<WorkerDiffRecord>> {
    await assertCanManageOrsSync();
    return orsSyncService.getWorkerDiffPage(page, limit, search, ministryMap, direction);
}

// ─── Import / sync workers ───────────────────────────────────────────────────

export async function importOrsNewWorkers(
    orsWorkerIds: number[],
    options: {
        defaultRoleId: string;
        ministryIdMap: Record<string, string>;
        migratePasswordHash: boolean;
    }
): Promise<ImportResult> {
    await assertCanManageOrsSync();
    const parsedOptions = importOrsNewWorkersOptionsSchema.parse(options);
    const result = await orsSyncService.importOrsNewWorkers(orsWorkerIds, parsedOptions);
    if (result.success > 0) revalidatePath('/workers');
    return result;
}

export async function syncOrsUpdatedWorkers(
    workers: Array<OrsWorker | SyncUpdatedWorkerInput>,
    ministryIdMap: Record<string, string> = {}
): Promise<ImportResult> {
    await assertCanManageOrsSync();
    const parsedWorkers = workers.map(w => syncUpdatedWorkerItemSchema.parse(w)) as Array<OrsWorker | SyncUpdatedWorkerInput>;
    const result = await orsSyncService.syncOrsUpdatedWorkers(parsedWorkers, ministryIdMap);
    if (result.success > 0) revalidatePath('/workers');
    return result;
}

export async function syncOrsWorkerPasswords(
    orsWorkerIds: number[]
): Promise<ImportResult> {
    await assertCanManageOrsSync();
    const result = await orsSyncService.syncOrsWorkerPasswords(orsWorkerIds);
    if (result.success > 0) {
        revalidatePath('/workers');
        revalidatePath('/settings/ors-sync');
    }
    return result;
}

// ─── Ministries ──────────────────────────────────────────────────────────────

export async function previewOrsMinistries(
    page = 1, limit = 50
): Promise<OrsPagedResponse<OrsMinistry>> {
    await assertCanManageOrsSync();
    return orsSyncService.previewOrsMinistries(page, limit);
}

export async function importOrsMinistries(
    ministries: OrsMinistry[]
): Promise<ImportResult> {
    await assertCanManageOrsSync();
    const result = await orsSyncService.importOrsMinistries(ministries);
    if (result.success > 0) revalidatePath('/ministries');
    return result;
}

// ─── Areas & branches ────────────────────────────────────────────────────────

export async function previewOrsSatellites(
    page = 1, limit = 50
): Promise<OrsPagedResponse<OrsSatellite>> {
    await assertCanManageOrsSync();
    return orsSyncService.previewOrsSatellites(page, limit);
}

export async function previewOrsAreas(
    page = 1, limit = 50
): Promise<OrsPagedResponse<OrsArea>> {
    await assertCanManageOrsSync();
    return orsSyncService.previewOrsAreas(page, limit);
}

export async function importOrsSatellites(satellites: OrsSatellite[]): Promise<ImportResult> {
    await assertCanManageOrsSync();
    return orsSyncService.importOrsSatellites(satellites);
}

export async function importOrsAreas(areas: OrsArea[]): Promise<ImportResult> {
    await assertCanManageOrsSync();
    return orsSyncService.importOrsAreas(areas);
}

// ─── C2S groups & mentees ────────────────────────────────────────────────────

export async function previewOrsMentorGroups(
    page = 1, limit = 50
): Promise<OrsPagedResponse<OrsMentorGroup>> {
    await assertCanManageOrsSync();
    return orsSyncService.previewOrsMentorGroups(page, limit);
}

export async function importOrsMentorGroups(groups: OrsMentorGroup[]): Promise<ImportResult> {
    await assertCanManageOrsSync();
    const result = await orsSyncService.importOrsMentorGroups(groups);
    if (result.success > 0) revalidatePath('/c2s');
    return result;
}

export async function previewOrsMentees(
    page = 1, limit = 50
): Promise<OrsPagedResponse<OrsMentee>> {
    await assertCanManageOrsSync();
    return orsSyncService.previewOrsMentees(page, limit);
}

export async function importOrsMentees(mentees: OrsMentee[]): Promise<ImportResult> {
    await assertCanManageOrsSync();
    const result = await orsSyncService.importOrsMentees(mentees);
    if (result.success > 0) revalidatePath('/c2s');
    return result;
}

// ─── Attendance ──────────────────────────────────────────────────────────────

export async function previewOrsAttendance(
    page = 1, limit = 50
): Promise<OrsPagedResponse<OrsAttendanceScan>> {
    await assertCanManageOrsSync();
    return orsSyncService.previewOrsAttendance(page, limit);
}

export async function importOrsAttendanceBatch(records: OrsAttendanceScan[]): Promise<ImportResult> {
    await assertCanManageOrsSync();
    return orsSyncService.importOrsAttendanceBatch(records);
}
