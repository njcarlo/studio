'use client';

import { useMutation } from '@tanstack/react-query';
import { doc } from 'firebase/firestore';
import { useFirestore, updateDocumentNonBlocking } from '@studio/database';
import { useToast } from '@/hooks/use-toast';
import type { Booking } from '@/lib/types';

/**
 * Hook for booking mutations (approve, reject).
 * Uses React Query's useMutation for automatic loading/error state management.
 */
export function useBookingMutations() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const updateStatusMutation = useMutation({
        mutationFn: async ({
            booking,
            newStatus,
        }: {
            booking: Booking;
            newStatus: 'Approved' | 'Rejected';
        }) => {
            if (!booking.id || !booking.roomId) {
                throw new Error('Missing booking ID or room ID');
            }

            const bookingRef = doc(
                firestore,
                `rooms/${booking.roomId}/reservations`,
                booking.id
            );

            return updateDocumentNonBlocking(bookingRef, {
                status: newStatus,
            });
        },
        onSuccess: (data, variables) => {
            toast({
                title: `Reservation ${variables.newStatus}`,
                description: `Successfully updated the status to ${variables.newStatus}.`,
            });
        },
        onError: (error) => {
            console.error('Status update error:', error);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Could not update the reservation status.',
            });
        },
    });

    return {
        updateStatus: updateStatusMutation.mutate,
        isUpdatingStatus: updateStatusMutation.isPending,
        statusUpdateError: updateStatusMutation.error,
    };
}
