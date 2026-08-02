'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { getPaginatedTransactionLogs } from '@/actions/db';

/**
 * Keyset/cursor pagination for the transaction/audit log. Search and optional
 * `module`/`action` filters run server-side; the list appends pages via
 * `fetchNextPage` rather than fetching the whole log. Mirrors {@link useWorkers}.
 */
export function useTransactionLogs(params: {
    limit?: number;
    search?: string;
    module?: string;
    action?: string;
    sortDir?: 'asc' | 'desc';
    enabled?: boolean;
} = {}) {
    const filters = {
        search: params.search,
        module: params.module,
        action: params.action,
        sortDir: params.sortDir,
    };
    const query = useInfiniteQuery({
        queryKey: ['transaction-logs-paginated', params.limit ?? 25, filters],
        queryFn: ({ pageParam }) => getPaginatedTransactionLogs(pageParam, params.limit, filters),
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
