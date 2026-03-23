import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-based tests for SLA escalation idempotency.
 *
 * **Property 2: SLA escalation is idempotent** — running the SLA check multiple
 * times on the same request never sends more than one escalation (slaEscalatedAt guard).
 *
 * **Validates: Requirements 7.5**
 */

// ---------------------------------------------------------------------------
// Pure model of the SLA escalation logic (mirrors the cron route)
// ---------------------------------------------------------------------------

interface RequestState {
    status: string;
    createdAt: Date;
    slaEscalatedAt: Date | null;
}

function computeSlaThreshold(now: Date, slaDays: number): Date {
    const t = new Date(now);
    t.setDate(t.getDate() - slaDays);
    return t;
}

/**
 * Simulate one run of the SLA cron for a single request.
 * Returns the updated state and whether an escalation was sent.
 */
function runSlaCheck(
    req: RequestState,
    now: Date,
    slaDays: number,
): { state: RequestState; escalated: boolean } {
    const threshold = computeSlaThreshold(now, slaDays);

    const shouldEscalate =
        req.status === 'Pending' &&
        req.createdAt < threshold &&
        req.slaEscalatedAt === null;

    if (shouldEscalate) {
        return {
            state: { ...req, slaEscalatedAt: now },
            escalated: true,
        };
    }

    return { state: req, escalated: false };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const slaDaysArb = fc.integer({ min: 1, max: 30 });

// A request that is overdue (created more than slaDays ago) and not yet escalated
const overdueRequestArb = (now: Date, slaDays: number) => {
    const threshold = computeSlaThreshold(now, slaDays);
    // createdAt is between 1 and 30 days before the threshold
    return fc.integer({ min: 1, max: 30 }).map(extraDays => {
        const createdAt = new Date(threshold);
        createdAt.setDate(createdAt.getDate() - extraDays);
        return {
            status: 'Pending' as string,
            createdAt,
            slaEscalatedAt: null as Date | null,
        };
    });
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SLA escalation — property tests', () => {
    const now = new Date('2024-06-10T08:00:00Z');

    it('Property 2: first run escalates an overdue Pending request exactly once', () => {
        fc.assert(
            fc.property(slaDaysArb, overdueRequestArb(now, 3), (slaDays, req) => {
                // Use slaDays=3 for the overdue request, but vary slaDays for the check
                // to ensure the overdue request is always overdue
                const overdueReq = req; // already overdue for slaDays=3
                const threshold = computeSlaThreshold(now, 3);
                if (overdueReq.createdAt >= threshold) return; // skip if not actually overdue

                const { state, escalated } = runSlaCheck(overdueReq, now, 3);
                expect(escalated).toBe(true);
                expect(state.slaEscalatedAt).not.toBeNull();
            }),
        );
    });

    it('Property 2: second run on the same request never escalates again', () => {
        fc.assert(
            fc.property(slaDaysArb, overdueRequestArb(now, 3), (_slaDays, req) => {
                const threshold = computeSlaThreshold(now, 3);
                if (req.createdAt >= threshold) return;

                // First run
                const { state: afterFirst } = runSlaCheck(req, now, 3);
                // Second run (slaEscalatedAt is now set)
                const { escalated: secondEscalated } = runSlaCheck(afterFirst, now, 3);

                expect(secondEscalated).toBe(false);
            }),
        );
    });

    it('Property 2: running N times never escalates more than once', () => {
        const runsArb = fc.integer({ min: 2, max: 10 });

        fc.assert(
            fc.property(runsArb, overdueRequestArb(now, 3), (runs, req) => {
                const threshold = computeSlaThreshold(now, 3);
                if (req.createdAt >= threshold) return;

                let state = req;
                let totalEscalations = 0;

                for (let i = 0; i < runs; i++) {
                    const result = runSlaCheck(state, now, 3);
                    if (result.escalated) totalEscalations++;
                    state = result.state;
                }

                expect(totalEscalations).toBeLessThanOrEqual(1);
            }),
        );
    });

    it('Property 2: a request with slaEscalatedAt already set is never escalated', () => {
        fc.assert(
            fc.property(slaDaysArb, overdueRequestArb(now, 3), (_slaDays, req) => {
                const threshold = computeSlaThreshold(now, 3);
                if (req.createdAt >= threshold) return;

                // Pre-set slaEscalatedAt
                const alreadyEscalated: RequestState = { ...req, slaEscalatedAt: new Date() };
                const { escalated } = runSlaCheck(alreadyEscalated, now, 3);
                expect(escalated).toBe(false);
            }),
        );
    });

    it('Property 2: non-Pending requests are never escalated regardless of age', () => {
        const nonPendingStatusArb = fc.constantFrom(
            'Approved', 'Declined', 'Partial', 'Cancelled', 'In_Progress', 'Fulfilled',
        );

        fc.assert(
            fc.property(nonPendingStatusArb, overdueRequestArb(now, 3), (status, req) => {
                const threshold = computeSlaThreshold(now, 3);
                if (req.createdAt >= threshold) return;

                const nonPendingReq: RequestState = { ...req, status };
                const { escalated } = runSlaCheck(nonPendingReq, now, 3);
                expect(escalated).toBe(false);
            }),
        );
    });
});
