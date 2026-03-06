'use client';

import { useMutation } from '@tanstack/react-query';
import { doc } from 'firebase/firestore';
import { useFirestore, updateDocumentNonBlocking } from '@studio/database';
import { useToast } from '@/hooks/use-toast';
import type { ApprovalRequest } from '@/lib/types';

/**
 * Hook for approval-related mutations.
 * Centralizes complex multi-stage approval logic and side-effects.
 */
export function useApprovalMutations() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const updateStatusMutation = useMutation({
        mutationFn: async ({
            request,
            status,
            options = {},
        }: {
            request: ApprovalRequest;
            status: 'Approved' | 'Rejected' | 'Pending Admin Approval' | 'Pending Incoming Approval';
            options?: {
                outgoingApproved?: boolean;
            };
        }) => {
            if (!request.id) throw new Error('Missing request ID');

            const requestRef = doc(firestore, 'approvals', request.id);

            // 1. Update the request itself
            const updateData: any = { status };
            if (options.outgoingApproved !== undefined) {
                updateData.outgoingApproved = options.outgoingApproved;
            }
            await updateDocumentNonBlocking(requestRef, updateData);

            // 2. Handle side-effects for Room Bookings
            if (request.type === 'Room Booking' && request.roomId && request.reservationId) {
                const reservationRef = doc(
                    firestore,
                    `rooms/${request.roomId}/reservations`,
                    request.reservationId
                );
                // Reservation status mirrors the approval status
                await updateDocumentNonBlocking(reservationRef, { status });
            }

            // 3. Handle final approval side-effects for workers
            if (status === 'Approved') {
                if (request.type === 'New Worker' && request.workerId) {
                    const workerRef = doc(firestore, 'workers', request.workerId);
                    await updateDocumentNonBlocking(workerRef, { status: 'Active' });
                }

                if (request.type === 'Ministry Change' && request.workerId) {
                    const workerRef = doc(firestore, 'workers', request.workerId);
                    await updateDocumentNonBlocking(workerRef, {
                        majorMinistryId: request.newMajorId || '',
                        minorMinistryId: request.newMinorId || '',
                    });
                }
            }

            return { request, status };
        },
        onSuccess: (data) => {
            const { request, status } = data;
            toast({
                title: `Request ${status}`,
                description: `Successfully updated the status of the ${request.type} request.`,
            });
        },
        onError: (error) => {
            console.error('Approval update error:', error);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Could not update the approval request.',
            });
        },
    });

    return {
        updateStatus: updateStatusMutation.mutate,
        isUpdating: updateStatusMutation.isPending,
    };
}
