'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { getScanLogs, createScanLog, getPaginatedScanLogs } from '@/actions/db';

/**
 * Keyset/cursor pagination for the scan-log stream. Search runs server-side and
 * the list appends pages via `fetchNextPage`. Mirrors {@link useWorkers}.
 */
export function usePaginatedScanLogs(params: {
    limit?: number;
    search?: string;
    sortDir?: 'asc' | 'desc';
    enabled?: boolean;
} = {}) {
    const filters = { search: params.search, sortDir: params.sortDir };
    const query = useInfiniteQuery({
        queryKey: ['scan-logs-paginated', params.limit ?? 25, filters],
        queryFn: ({ pageParam }) => getPaginatedScanLogs(pageParam, params.limit, filters),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        staleTime: 60_000,
        enabled: params.enabled ?? true,
    });
    const logs = query.data?.pages.flatMap((p) => p.logs) ?? [];
    return {
        logs,
        hasNextPage: query.hasNextPage ?? false,
        fetchNextPage: query.fetchNextPage,
        isFetchingNextPage: query.isFetchingNextPage,
        loadedCount: logs.length,
        isLoading: query.isLoading,
        error: query.error,
    };
}

export function useScanLogs(limitCount?: number) {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['scan-logs', limitCount],
        queryFn: () => getScanLogs(), // Actually should probably pass limit to getScanLogs if needed
    });

    const createMutation = useMutation({
        mutationFn: createScanLog,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scan-logs'] });
        },
    });

    return {
        scanLogs: data || [],
        isLoading,
        error,
        createScanLog: createMutation.mutateAsync,
    };
}
