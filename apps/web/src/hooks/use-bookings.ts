'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBookings } from '@/actions/db';

export function useBookings(filters: { workerProfileId?: string; dateFrom?: Date } = {}) {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['bookings', filters],
        queryFn: () => getBookings(filters),
    });

    return {
        bookings: data || [],
        isLoading,
        error,
    };
}
