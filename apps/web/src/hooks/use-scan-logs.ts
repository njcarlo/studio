'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getScanLogs, createScanLog } from '@/actions/db';

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
