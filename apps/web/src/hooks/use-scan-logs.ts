'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getScanLogs, createScanLog } from '@/actions/db';

export function useScanLogs(limitCount?: number, scanType?: string) {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['scan-logs', limitCount, scanType],
        queryFn: () => getScanLogs(limitCount, scanType),
        staleTime: 10_000,
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
