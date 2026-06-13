import { describe, it, expect } from 'vitest';
import { getActiveStages } from '@/services/approval-engine';
import type { ApprovalStage } from '@prisma/client';

/**
 * Unit tests for the approval workflow engine's stage-activation logic
 * (getActiveStages), covering the workflow shapes used across the app:
 * single-stage, linear multi-stage, and parallel-group-then-sequential
 * (Major Event Request).
 */

function makeStage(overrides: Partial<ApprovalStage>): ApprovalStage {
    return {
        id: 'stage-id',
        workflowId: 'workflow-id',
        stageOrder: 1,
        parallelGroup: null,
        approverSpec: {} as any,
        status: 'Pending',
        decidedBy: null,
        decidedAt: null,
        reason: null,
        createdAt: new Date(),
        ...overrides,
    };
}

describe('getActiveStages', () => {
    it('returns the only stage for a single-stage workflow', () => {
        const stages = [makeStage({ id: 's1', stageOrder: 1 })];
        expect(getActiveStages(stages).map((s) => s.id)).toEqual(['s1']);
    });

    it('returns an empty list once the single stage is decided', () => {
        const stages = [makeStage({ id: 's1', stageOrder: 1, status: 'Approved' })];
        expect(getActiveStages(stages)).toEqual([]);
    });

    it('activates stages in order for a linear multi-stage workflow', () => {
        const stages = [
            makeStage({ id: 's1', stageOrder: 1, status: 'Approved' }),
            makeStage({ id: 's2', stageOrder: 2, status: 'Pending' }),
            makeStage({ id: 's3', stageOrder: 3, status: 'Pending' }),
        ];
        expect(getActiveStages(stages).map((s) => s.id)).toEqual(['s2']);
    });

    it('advances to the final stage once all prior stages are decided', () => {
        const stages = [
            makeStage({ id: 's1', stageOrder: 1, status: 'Approved' }),
            makeStage({ id: 's2', stageOrder: 2, status: 'Approved' }),
            makeStage({ id: 's3', stageOrder: 3, status: 'Pending' }),
        ];
        expect(getActiveStages(stages).map((s) => s.id)).toEqual(['s3']);
    });

    it('activates all stages in a parallel group simultaneously', () => {
        const stages = [
            makeStage({ id: 'min1', stageOrder: 1, parallelGroup: 1 }),
            makeStage({ id: 'min2', stageOrder: 2, parallelGroup: 1 }),
            makeStage({ id: 'min3', stageOrder: 3, parallelGroup: 1 }),
            makeStage({ id: 'final', stageOrder: 4 }),
        ];
        expect(getActiveStages(stages).map((s) => s.id).sort()).toEqual(['min1', 'min2', 'min3']);
    });

    it('keeps the remaining parallel-group stages active until all are decided', () => {
        const stages = [
            makeStage({ id: 'min1', stageOrder: 1, parallelGroup: 1, status: 'Approved' }),
            makeStage({ id: 'min2', stageOrder: 2, parallelGroup: 1, status: 'Pending' }),
            makeStage({ id: 'min3', stageOrder: 3, parallelGroup: 1, status: 'Rejected' }),
            makeStage({ id: 'final', stageOrder: 4, status: 'Pending' }),
        ];
        expect(getActiveStages(stages).map((s) => s.id)).toEqual(['min2']);
    });

    it('moves to the sequential stage after the parallel group is fully decided', () => {
        const stages = [
            makeStage({ id: 'min1', stageOrder: 1, parallelGroup: 1, status: 'Approved' }),
            makeStage({ id: 'min2', stageOrder: 2, parallelGroup: 1, status: 'Approved' }),
            makeStage({ id: 'min3', stageOrder: 3, parallelGroup: 1, status: 'Rejected' }),
            makeStage({ id: 'final', stageOrder: 4, status: 'Pending' }),
        ];
        expect(getActiveStages(stages).map((s) => s.id)).toEqual(['final']);
    });

    it('returns an empty list once every stage is decided', () => {
        const stages = [
            makeStage({ id: 's1', stageOrder: 1, status: 'Approved' }),
            makeStage({ id: 's2', stageOrder: 2, status: 'Rejected' }),
        ];
        expect(getActiveStages(stages)).toEqual([]);
    });
});
