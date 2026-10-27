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
        onMutate: async ({ booking, newStatus }) => {
            await queryClient.cancelQueries({ queryKey: ['bookings'] });
            const previousBookings = queryClient.getQueriesData({ queryKey: ['bookings'] });

            queryClient.setQueriesData({ queryKey: ['bookings'] }, (old: any) => {
                if (!Array.isArray(old)) return old;
                return old.map((b: any) => (b.id === booking.id ? { ...b, status: newStatus } : b));
            });

            return { previousBookings };
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
            queryClient.invalidateQueries({ queryKey: ['room-bookings'] });
            toast({
                title: variables.newStatus === 'Approved' ? 'Reservation Approved' : `Reservation ${variables.newStatus}`,
                description: variables.newStatus === 'Approved'
                    ? 'Room reservation has been successfully approved and reserved.'
                    : `Successfully updated the status to ${variables.newStatus}.`,
            });
        },
        onError: (error, _variables, context: any) => {
            if (context?.previousBookings) {
                context.previousBookings.forEach(([queryKey, data]: [any, any]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
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
