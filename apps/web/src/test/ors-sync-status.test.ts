import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Tests for the durable ORS sync-run tracking added alongside the weekly
 * scheduled sync — specifically the two behaviours the UI depends on:
 *
 *   1. `getOrsSyncStatus` reports `isRunning` from the DB, and does NOT count a
 *      run abandoned by a recycled serverless instance as still in flight.
 *   2. `withSyncRun` (exercised through a wrapped importer) opens a `running`
 *      row before the work and stamps the result when it settles — including
 *      on failure.
 */

const prismaMock = {
    orsSyncRun: {
        create: vi.fn(),
        update: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
    },
    branch: {
        findFirst: vi.fn(),
        create: vi.fn(),
    },
    transactionLog: { create: vi.fn() },
};

vi.mock('@studio/database/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/lib/firebase-admin', () => ({ firebaseAdminAuth: {} }));

const THIRTY_ONE_MIN = 31 * 60 * 1000;

function run(overrides: Record<string, unknown> = {}) {
    return {
        id: 'run-1',
        scope: 'ministries',
        trigger: 'manual',
        status: 'running',
        startedAt: new Date(),
        finishedAt: null,
        succeeded: 0,
        skipped: 0,
        failed: 0,
        errors: [],
        message: null,
        startedById: null,
        startedByName: null,
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.orsSyncRun.create.mockResolvedValue({ id: 'run-1' });
    prismaMock.orsSyncRun.update.mockResolvedValue({});
    prismaMock.orsSyncRun.findFirst.mockResolvedValue(null);
    prismaMock.orsSyncRun.findMany.mockResolvedValue([]);
});

describe('getOrsSyncStatus', () => {
    it('reports a fresh running row as in flight', async () => {
        const { getOrsSyncStatus } = await import('@/services/ors-sync');
        const active = run({ startedAt: new Date() });
        prismaMock.orsSyncRun.findMany.mockImplementation(async (args: any) =>
            args?.where?.status === 'running' ? [active] : [active]
        );

        const status = await getOrsSyncStatus();

        expect(status.isRunning).toBe(true);
        expect(status.current?.id).toBe('run-1');
        expect(status.stale).toHaveLength(0);
    });

    it('does not count an abandoned run as in flight, but does surface it as stale', async () => {
        const { getOrsSyncStatus } = await import('@/services/ors-sync');
        const abandoned = run({ startedAt: new Date(Date.now() - THIRTY_ONE_MIN) });
        prismaMock.orsSyncRun.findMany.mockResolvedValue([abandoned]);

        const status = await getOrsSyncStatus();

        expect(status.isRunning).toBe(false);
        expect(status.current).toBeNull();
        expect(status.stale).toHaveLength(1);
    });

    it('reports idle with no runs at all', async () => {
        const { getOrsSyncStatus } = await import('@/services/ors-sync');

        const status = await getOrsSyncStatus();

        expect(status.isRunning).toBe(false);
        expect(status.lastCompleted).toBeNull();
        expect(status.lastScheduledAt).toBeNull();
    });
});

describe('withSyncRun bookkeeping', () => {
    it('opens a running row and stamps the counts on success', async () => {
        const { importOrsSatellites } = await import('@/services/ors-sync');
        prismaMock.branch.findFirst.mockResolvedValue(null);
        prismaMock.branch.create.mockResolvedValue({ id: 'b1' });

        const result = await importOrsSatellites([{ id: 1, name: 'North' }], {
            trigger: 'manual',
            actorId: 'w1',
            actorName: 'ops@example.com',
        });

        expect(result.success).toBe(1);

        const created = prismaMock.orsSyncRun.create.mock.calls[0][0];
        expect(created.data).toMatchObject({
            scope: 'branches',
            trigger: 'manual',
            status: 'running',
            startedById: 'w1',
        });

        const updated = prismaMock.orsSyncRun.update.mock.calls[0][0];
        expect(updated.where).toEqual({ id: 'run-1' });
        expect(updated.data).toMatchObject({ status: 'success', succeeded: 1, failed: 0 });
        expect(updated.data.finishedAt).toBeInstanceOf(Date);
    });

    it('marks the run failed and rethrows when the import throws', async () => {
        const { importOrsSatellites } = await import('@/services/ors-sync');
        prismaMock.branch.findFirst.mockRejectedValue(new Error('boom'));

        // The per-row try/catch swallows row errors, so force a run-level throw
        // by making the whole call reject: a null record blows up on `s.name`.
        await expect(importOrsSatellites(null as any)).rejects.toThrow();

        const updated = prismaMock.orsSyncRun.update.mock.calls[0][0];
        expect(updated.data).toMatchObject({ status: 'failed' });
        expect(updated.data.message).toBeTruthy();
    });

    it('still runs the import when the run-record write fails', async () => {
        const { importOrsSatellites } = await import('@/services/ors-sync');
        prismaMock.orsSyncRun.create.mockRejectedValue(new Error('db down'));
        prismaMock.branch.findFirst.mockResolvedValue(null);
        prismaMock.branch.create.mockResolvedValue({ id: 'b1' });

        const result = await importOrsSatellites([{ id: 1, name: 'North' }]);

        expect(result.success).toBe(1);
        expect(prismaMock.orsSyncRun.update).not.toHaveBeenCalled();
    });
});

describe('weeklyWorkerMode', () => {
    // Restore only the two keys this block touches. Replacing `process.env`
    // wholesale would clobber env that other test files in the same worker
    // depend on, which shows up as an unrelated intermittent failure.
    const KEYS = ['ORS_WEEKLY_WORKERS', 'ORS_WEEKLY_INCLUDE_WORKERS'] as const;
    const ORIGINAL = new Map(KEYS.map((k) => [k, process.env[k]]));

    afterEach(() => {
        for (const [k, v] of ORIGINAL) {
            if (v === undefined) delete process.env[k];
            else process.env[k] = v;
        }
    });

    it('adds new workers by default', async () => {
        const { weeklyWorkerMode } = await import('@/services/ors-sync');
        delete process.env.ORS_WEEKLY_WORKERS;
        delete process.env.ORS_WEEKLY_INCLUDE_WORKERS;

        expect(weeklyWorkerMode()).toBe('new');
    });

    it('honours each explicit mode', async () => {
        const { weeklyWorkerMode } = await import('@/services/ors-sync');

        for (const mode of ['none', 'new', 'all'] as const) {
            process.env.ORS_WEEKLY_WORKERS = mode;
            expect(weeklyWorkerMode()).toBe(mode);
        }

        // Case and padding shouldn't matter — these get typed into a console.
        process.env.ORS_WEEKLY_WORKERS = '  ALL  ';
        expect(weeklyWorkerMode()).toBe('all');
    });

    it('falls back to the default on an unrecognised value rather than doing nothing', async () => {
        const { weeklyWorkerMode } = await import('@/services/ors-sync');
        process.env.ORS_WEEKLY_WORKERS = 'yes-please';

        expect(weeklyWorkerMode()).toBe('new');
    });

    it('still honours the old ORS_WEEKLY_INCLUDE_WORKERS spelling as "all"', async () => {
        const { weeklyWorkerMode } = await import('@/services/ors-sync');
        delete process.env.ORS_WEEKLY_WORKERS;
        process.env.ORS_WEEKLY_INCLUDE_WORKERS = 'true';

        expect(weeklyWorkerMode()).toBe('all');
    });

    it('lets the new setting override the old one', async () => {
        const { weeklyWorkerMode } = await import('@/services/ors-sync');
        process.env.ORS_WEEKLY_INCLUDE_WORKERS = 'true';
        process.env.ORS_WEEKLY_WORKERS = 'new';

        expect(weeklyWorkerMode()).toBe('new');
    });
});

function orsWorker(overrides: Partial<{
    id: number; first_name: string; last_name: string; email: string | null; mobile: string | null;
}> = {}) {
    return {
        id: 1,
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'ada@example.com',
        username: null,
        mobile: '0917',
        birthdate: null,
        ministry_id: null,
        sec_ministry_id: null,
        status: 'active',
        worker_type: 'Volunteer',
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
        ...overrides,
    };
}

function localWorker(overrides: Record<string, unknown> = {}) {
    return {
        id: 'w1',
        workerId: '1',
        legacyPasswordHash: null,
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        phone: '0917',
        address: null,
        birthDate: null,
        startMonth: null,
        startYear: null,
        remarks: null,
        biometricsId: null,
        qrToken: null,
        status: 'Active',
        majorMinistryId: '',
        minorMinistryId: '',
        employmentType: 'Volunteer',
        roleId: 'viewer',
        ...overrides,
    };
}

describe('weekly worker index collectors', () => {
    it('finds new ORS workers anywhere in the table, not just page 1', async () => {
        const { collectNewOrsWorkerIdsFromIndex } = await import('@/services/ors-sync');
        const local = localWorker({ workerId: '1', email: 'ada@example.com' });
        const byWorkerId = new Map([['1', local]]);
        const matchLocal = (ors: { id: number; email: string | null }) =>
            byWorkerId.get(String(ors.id));

        const ids = collectNewOrsWorkerIdsFromIndex({
            orsWorkers: [
                orsWorker({ id: 1, email: 'ada@example.com' }),
                orsWorker({ id: 9001, first_name: 'New', last_name: 'Hire', email: 'new@example.com' }),
            ],
            matchLocal,
        });

        expect(ids).toEqual([9001]);
    });

    it('finds field updates past the first page of the ORS table', async () => {
        const { collectUpdatedWorkersFromIndex } = await import('@/services/ors-sync');
        const ada = localWorker({ workerId: '1', email: 'ada@example.com', phone: '0917' });
        const zoe = localWorker({
            id: 'w2',
            workerId: '9001',
            firstName: 'Zoe',
            lastName: 'Old',
            email: 'zoe@example.com',
            phone: '0000',
        });
        const byWorkerId = new Map([['1', ada], ['9001', zoe]]);
        const matchLocal = (ors: { id: number }) => byWorkerId.get(String(ors.id));

        const updated = collectUpdatedWorkersFromIndex(
            {
                orsWorkers: [
                    orsWorker({ id: 1 }),
                    orsWorker({ id: 9001, first_name: 'Zoe', last_name: 'New', email: 'zoe@example.com', mobile: '0000' }),
                ],
                matchLocal,
            },
            {},
        );

        expect(updated).toHaveLength(1);
        expect(updated[0].worker.id).toBe(9001);
        expect(updated[0].fields).toContain('Last Name');
    });

    it('skips ORS rows that already match local records', async () => {
        const { collectUpdatedWorkersFromIndex } = await import('@/services/ors-sync');
        const local = localWorker();
        const matchLocal = () => local;

        const updated = collectUpdatedWorkersFromIndex(
            { orsWorkers: [orsWorker()], matchLocal },
            {},
        );

        expect(updated).toEqual([]);
    });
});
