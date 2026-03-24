'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateBooking } from '@/actions/db';
import { useToast } from '@/hooks/use-toast';
import type { Booking } from '@/lib/types';

/**
 * Hook for booking mutations (approve, reject).
 * Uses React Query's useMutation for automatic loading/error state management.
 */
export function useBookingMutations() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const updateStatusMutation = useMutation({
        mutationFn: async ({
            booking,
            newStatus,
        }: {
            booking: Booking;
            newStatus: 'Approved' | 'Rejected';
        }) => {
            if (!booking.id) {
                throw new Error('Missing booking ID');
            }
            return updateBooking(booking.id, { status: newStatus });
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
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
