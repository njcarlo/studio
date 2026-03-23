import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { deriveRequestStatus } from '@/actions/venue-assistance';
import type { ItemStatus } from '@/actions/venue-assistance';

/**
 * Property-based tests for `deriveRequestStatus`.
 *
 * **Property 1: Status derivation is total and deterministic**
 * For any non-empty array of item statuses, `deriveRequestStatus` always returns
 * exactly one of `Approved | Partial | Declined` and the same input always
 * produces the same output.
 *
 * **Validates: Requirements 5.5**
 */
describe('deriveRequestStatus — property tests', () => {
    const itemStatusArb = fc.constantFrom<ItemStatus>('Approved', 'Declined');
    const nonEmptyStatusArrayArb = fc.array(itemStatusArb, { minLength: 1 });

    it('Property 1: always returns one of Approved | Partial | Declined for any non-empty input', () => {
        fc.assert(
            fc.property(nonEmptyStatusArrayArb, (statuses) => {
                const result = deriveRequestStatus(statuses);
                expect(['Approved', 'Partial', 'Declined']).toContain(result);
            }),
        );
    });

    it('Property 1: is deterministic — same input always produces same output', () => {
        fc.assert(
            fc.property(nonEmptyStatusArrayArb, (statuses) => {
                const result1 = deriveRequestStatus(statuses);
                const result2 = deriveRequestStatus(statuses);
                expect(result1).toBe(result2);
            }),
        );
    });

    it('Property 1: all-Approved input always yields Approved', () => {
        fc.assert(
            fc.property(fc.array(fc.constant<ItemStatus>('Approved'), { minLength: 1 }), (statuses) => {
                expect(deriveRequestStatus(statuses)).toBe('Approved');
            }),
        );
    });

    it('Property 1: all-Declined input always yields Declined', () => {
        fc.assert(
            fc.property(fc.array(fc.constant<ItemStatus>('Declined'), { minLength: 1 }), (statuses) => {
                expect(deriveRequestStatus(statuses)).toBe('Declined');
            }),
        );
    });

    it('Property 1: mixed input (at least one Approved and one Declined) always yields Partial', () => {
        const mixedArb = fc
            .tuple(
                fc.array(fc.constant<ItemStatus>('Approved'), { minLength: 1 }),
                fc.array(fc.constant<ItemStatus>('Declined'), { minLength: 1 }),
            )
            .map(([approved, declined]) => [...approved, ...declined]);

        fc.assert(
            fc.property(mixedArb, (statuses) => {
                expect(deriveRequestStatus(statuses)).toBe('Partial');
            }),
        );
    });
});
