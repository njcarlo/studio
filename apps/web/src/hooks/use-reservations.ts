'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { getPaginatedBookings } from '@/actions/db';

/**
 * Keyset/cursor pagination for the "All Reservations" admin view. Search and
 * status filtering run server-side; the table appends pages via `fetchNextPage`
 * rather than fetching every booking up front. Mirrors {@link useWorkers}.
 */
export function useAllReservations(params: {
    limit?: number;
    search?: string;
    status?: string;
    sortDir?: 'asc' | 'desc';
    enabled?: boolean;
} = {}) {
    const filters = {
        search: params.search,
        status: params.status,
        sortDir: params.sortDir,
    };

    const {
        data,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['bookings', params.limit ?? 25, filters],
        queryFn: ({ pageParam }) => getPaginatedBookings(pageParam, params.limit, filters),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        staleTime: 60_000,
        enabled: params.enabled ?? true,
    });

    const bookings = data?.pages.flatMap((p) => p.bookings) ?? [];

    return {
        bookings,
        hasNextPage: hasNextPage ?? false,
        fetchNextPage,
        isFetchingNextPage,
        loadedCount: bookings.length,
        isLoading,
        error,
    };
}
