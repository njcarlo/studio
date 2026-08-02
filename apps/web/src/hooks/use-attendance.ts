'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { getAttendanceRecords, createAttendanceRecord, getPaginatedAttendanceRecords } from '@/actions/db';

/**
 * Keyset/cursor pagination for attendance records. Search (by worker name) plus
 * optional worker/date filters run server-side; the list appends pages via
 * `fetchNextPage`. Mirrors {@link useWorkers}.
 */
export function usePaginatedAttendance(params: {
    limit?: number;
    search?: string;
    workerProfileId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    sortDir?: 'asc' | 'desc';
    enabled?: boolean;
} = {}) {
    const filters = {
        search: params.search,
        workerProfileId: params.workerProfileId,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        sortDir: params.sortDir,
    };
    const query = useInfiniteQuery({
        queryKey: ['attendance-paginated', params.limit ?? 25, filters],
        queryFn: ({ pageParam }) => getPaginatedAttendanceRecords(pageParam, params.limit, filters),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        staleTime: 60_000,
        enabled: params.enabled ?? true,
    });
    const records = query.data?.pages.flatMap((p) => p.records) ?? [];
    return {
        records,
        hasNextPage: query.hasNextPage ?? false,
        fetchNextPage: query.fetchNextPage,
        isFetchingNextPage: query.isFetchingNextPage,
        loadedCount: records.length,
        isLoading: query.isLoading,
        error: query.error,
    };
}

export function useAttendance(filters: { workerProfileId?: string; dateFrom?: Date } = {}) {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['attendance', filters],
        queryFn: () => getAttendanceRecords(filters),
    });

    const createMutation = useMutation({
        mutationFn: createAttendanceRecord,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
        },
    });

    return {
        attendanceRecords: data || [],
        isLoading,
        error,
        createAttendanceRecord: createMutation.mutateAsync,
    };
}
