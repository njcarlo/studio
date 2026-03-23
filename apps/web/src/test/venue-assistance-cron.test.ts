import { describe, it, expect } from 'vitest';

/**
 * Unit tests for cron SLA query logic.
 * Validates: Requirements 7.2, 7.5
 *
 * These tests verify the boundary conditions for SLA escalation filtering
 * without hitting the database — they test the pure date-comparison logic
 * that the cron route uses to build its Prisma query.
 */

// ---------------------------------------------------------------------------
// Pure helper: mirrors the cron route's SLA threshold calculation
// ---------------------------------------------------------------------------

function computeSlaThreshold(now: Date, slaDays: number): Date {
    const threshold = new Date(now);
    threshold.setDate(threshold.getDate() - slaDays);
    return threshold;
}

function isOverSla(createdAt: Date, slaThreshold: Date): boolean {
    return createdAt < slaThreshold;
}

function shouldEscalate(request: {
    status: string;
    createdAt: Date;
    slaEscalatedAt: Date | null;
}, slaThreshold: Date): boolean {
    return (
        request.status === 'Pending' &&
        isOverSla(request.createdAt, slaThreshold) &&
        request.slaEscalatedAt === null
    );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SLA threshold calculation', () => {
    it('threshold is exactly slaDays before now', () => {
        const now = new Date('2024-06-10T08:00:00Z');
        const threshold = computeSlaThreshold(now, 3);
        expect(threshold.toISOString()).toBe('2024-06-07T08:00:00.000Z');
    });

    it('threshold respects custom slaDays', () => {
        const now = new Date('2024-06-10T08:00:00Z');
        const threshold = computeSlaThreshold(now, 7);
        expect(threshold.toISOString()).toBe('2024-06-03T08:00:00.000Z');
    });
});

describe('SLA boundary: requests included/excluded correctly', () => {
    const now = new Date('2024-06-10T08:00:00Z');
    const slaDays = 3;
    const threshold = computeSlaThreshold(now, slaDays);

    it('includes a request created strictly before the threshold', () => {
        // 4 days ago — over SLA
        const createdAt = new Date('2024-06-06T08:00:00Z');
        expect(isOverSla(createdAt, threshold)).toBe(true);
    });

    it('excludes a request created exactly at the threshold', () => {
        // Exactly at threshold — NOT over SLA (lt, not lte)
        const createdAt = new Date('2024-06-07T08:00:00Z');
        expect(isOverSla(createdAt, threshold)).toBe(false);
    });

    it('excludes a request created after the threshold', () => {
        // 2 days ago — within SLA
        const createdAt = new Date('2024-06-08T08:00:00Z');
        expect(isOverSla(createdAt, threshold)).toBe(false);
    });

    it('excludes a request created today', () => {
        expect(isOverSla(now, threshold)).toBe(false);
    });
});

describe('shouldEscalate: already-escalated requests are skipped', () => {
    const now = new Date('2024-06-10T08:00:00Z');
    const threshold = computeSlaThreshold(now, 3);
    const overdueCreatedAt = new Date('2024-06-05T08:00:00Z'); // 5 days ago

    it('escalates a Pending overdue request with no prior escalation', () => {
        const req = { status: 'Pending', createdAt: overdueCreatedAt, slaEscalatedAt: null };
        expect(shouldEscalate(req, threshold)).toBe(true);
    });

    it('skips a request that was already escalated (slaEscalatedAt is set)', () => {
        const req = {
            status: 'Pending',
            createdAt: overdueCreatedAt,
            slaEscalatedAt: new Date('2024-06-09T08:00:00Z'),
        };
        expect(shouldEscalate(req, threshold)).toBe(false);
    });

    it('skips a non-Pending request even if overdue', () => {
        const req = { status: 'Approved', createdAt: overdueCreatedAt, slaEscalatedAt: null };
        expect(shouldEscalate(req, threshold)).toBe(false);
    });

    it('skips a Declined request even if overdue', () => {
        const req = { status: 'Declined', createdAt: overdueCreatedAt, slaEscalatedAt: null };
        expect(shouldEscalate(req, threshold)).toBe(false);
    });

    it('skips a Cancelled request even if overdue', () => {
        const req = { status: 'Cancelled', createdAt: overdueCreatedAt, slaEscalatedAt: null };
        expect(shouldEscalate(req, threshold)).toBe(false);
    });
});
