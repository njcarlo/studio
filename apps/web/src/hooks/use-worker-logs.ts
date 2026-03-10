'use client';

import { useQuery } from '@tanstack/react-query';
import { getWorkerLogs } from '@/actions/db';

export function useWorkerLogs(workerId: string | undefined) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['workerLogs', workerId],
        queryFn: () => workerId ? getWorkerLogs(workerId) : Promise.resolve([]),
        enabled: !!workerId,
    });

    return {
        logs: data || [],
        isLoading,
        error,
    };
}
