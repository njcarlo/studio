import { describe, it, expect } from 'vitest';
import { bookingStatusForWorkflow } from '@/services/room-reservation-workflow';
import type { ApprovalStage, ApprovalWorkflow } from '@prisma/client';

/**
 * Unit tests for mapping a Room Booking ApprovalWorkflow's progress onto the
 * legacy Booking.status strings the reservations UI keys off.
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

function makeWorkflow(status: string, stages: ApprovalStage[]): ApprovalWorkflow & { stages: ApprovalStage[] } {
    return {
        id: 'workflow-id',
        type: 'Room Booking',
        subjectId: 'booking-id',
        requesterId: 'worker-id',
        status,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        stages,
    };
}

describe('bookingStatusForWorkflow', () => {
    it('maps stage 1 (Ministry Head) active to Pending Ministry Approval', () => {
        const workflow = makeWorkflow('Pending', [
            makeStage({ id: 's1', stageOrder: 1 }),
            makeStage({ id: 's2', stageOrder: 2 }),
            makeStage({ id: 's3', stageOrder: 3 }),
        ]);
        expect(bookingStatusForWorkflow(workflow)).toBe('Pending Ministry Approval');
    });

    it('maps stage 2 (Department Head) active to Pending Admin Approval', () => {
        const workflow = makeWorkflow('Pending', [
            makeStage({ id: 's1', stageOrder: 1, status: 'Approved' }),
            makeStage({ id: 's2', stageOrder: 2 }),
            makeStage({ id: 's3', stageOrder: 3 }),
        ]);
        expect(bookingStatusForWorkflow(workflow)).toBe('Pending Admin Approval');
    });

    it('maps stage 3 (Room Reservation Manager) active to Pending Admin Approval', () => {
        const workflow = makeWorkflow('Pending', [
            makeStage({ id: 's1', stageOrder: 1, status: 'Approved' }),
            makeStage({ id: 's2', stageOrder: 2, status: 'Approved' }),
            makeStage({ id: 's3', stageOrder: 3 }),
        ]);
        expect(bookingStatusForWorkflow(workflow)).toBe('Pending Admin Approval');
    });

    it('maps an approved workflow to Approved regardless of stage state', () => {
        const workflow = makeWorkflow('Approved', [
            makeStage({ id: 's1', stageOrder: 1, status: 'Approved' }),
            makeStage({ id: 's2', stageOrder: 2, status: 'Approved' }),
            makeStage({ id: 's3', stageOrder: 3, status: 'Approved' }),
        ]);
        expect(bookingStatusForWorkflow(workflow)).toBe('Approved');
    });

    it('maps a rejected workflow to Rejected regardless of which stage rejected', () => {
        const workflow = makeWorkflow('Rejected', [
            makeStage({ id: 's1', stageOrder: 1, status: 'Approved' }),
            makeStage({ id: 's2', stageOrder: 2, status: 'Rejected', reason: 'Room unavailable' }),
            makeStage({ id: 's3', stageOrder: 3 }),
        ]);
        expect(bookingStatusForWorkflow(workflow)).toBe('Rejected');
    });
});
