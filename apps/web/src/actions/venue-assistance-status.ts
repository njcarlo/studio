export type ItemStatus = 'Approved' | 'Declined' | 'Pending';
export type RequestStatus = 'Approved' | 'Declined' | 'Partial';

/**
 * Derive the overall request status from a list of item statuses.
 * - All Approved -> Approved
 * - All Declined -> Declined
 * - Mixed -> Partial
 */
export function deriveRequestStatus(itemStatuses: ItemStatus[]): RequestStatus {
    const allApproved = itemStatuses.every((status) => status === 'Approved');
    const allDeclined = itemStatuses.every((status) => status === 'Declined');

    if (allApproved) return 'Approved';
    if (allDeclined) return 'Declined';
    return 'Partial';
}