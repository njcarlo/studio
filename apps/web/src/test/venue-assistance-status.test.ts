import { describe, it, expect } from 'vitest';
import { deriveRequestStatus } from '@/actions/venue-assistance';
import type { ItemStatus } from '@/actions/venue-assistance';

/**
 * Unit tests for `deriveRequestStatus` helper.
 * Validates: Requirements 5.5
 */
describe('deriveRequestStatus', () => {
    it('returns Approved when all items are Approved', () => {
        const statuses: ItemStatus[] = ['Approved', 'Approved', 'Approved'];
        expect(deriveRequestStatus(statuses)).toBe('Approved');
    });

    it('returns Approved for a single Approved item', () => {
        expect(deriveRequestStatus(['Approved'])).toBe('Approved');
    });

    it('returns Declined when all items are Declined', () => {
        const statuses: ItemStatus[] = ['Declined', 'Declined', 'Declined'];
        expect(deriveRequestStatus(statuses)).toBe('Declined');
    });

    it('returns Declined for a single Declined item', () => {
        expect(deriveRequestStatus(['Declined'])).toBe('Declined');
    });

    it('returns Partial when some items are Approved and some Declined', () => {
        const statuses: ItemStatus[] = ['Approved', 'Declined'];
        expect(deriveRequestStatus(statuses)).toBe('Partial');
    });

    it('returns Partial when first item is Declined and rest are Approved', () => {
        const statuses: ItemStatus[] = ['Declined', 'Approved', 'Approved'];
        expect(deriveRequestStatus(statuses)).toBe('Partial');
    });

    it('returns Partial when only one item is Approved among many Declined', () => {
        const statuses: ItemStatus[] = ['Declined', 'Declined', 'Approved'];
        expect(deriveRequestStatus(statuses)).toBe('Partial');
    });

    it('returns Partial when only one item is Declined among many Approved', () => {
        const statuses: ItemStatus[] = ['Approved', 'Approved', 'Declined'];
        expect(deriveRequestStatus(statuses)).toBe('Partial');
    });
});
