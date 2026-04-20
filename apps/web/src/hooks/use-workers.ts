'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    getWorkers, 
    createWorker, 
    updateWorker, 
    deleteWorker, 
    deleteWorkers,
    getPaginatedWorkers,
    getWorkerStats,
    createWorkerWithAuth
} from '@/actions/db';

export function useWorkers(params: {
    page?: number;
    limit?: number;
    search?: string;
    searchMode?: 'workerId' | 'name';
    ministryIds?: string[];
    sortField?: string;
    sortDir?: 'asc' | 'desc';
    enabled?: boolean;
} = {}) {
    const queryClient = useQueryClient();
    const { enabled = true, ...queryParams } = params;

    const { data, isLoading, error } = useQuery({
        queryKey: ['workers', queryParams],
        queryFn: () => getPaginatedWorkers(queryParams.page, queryParams.limit, {
            search: queryParams.search,
            searchMode: queryParams.searchMode,
            ministryIds: queryParams.ministryIds,
            sortField: queryParams.sortField,
            sortDir: queryParams.sortDir,
        }),
        enabled: enabled,
        staleTime: 30_000,
        placeholderData: (prev) => prev,
    });

    const createMutation = useMutation({
        mutationFn: createWorker,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workers'] });
            queryClient.invalidateQueries({ queryKey: ['worker-stats'] });
        },
    });

    const createWithAuthMutation = useMutation({
        mutationFn: ({ data, roleIds, assignedBy }: { data: any; roleIds: string[]; assignedBy?: string }) => createWorkerWithAuth(data, roleIds, assignedBy),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workers'] });
            queryClient.invalidateQueries({ queryKey: ['worker-stats'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateWorker(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workers'] });
            queryClient.invalidateQueries({ queryKey: ['worker-stats'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteWorker,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workers'] });
            queryClient.invalidateQueries({ queryKey: ['worker-stats'] });
        },
    });

    const deleteBatchMutation = useMutation({
        mutationFn: deleteWorkers,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workers'] });
            queryClient.invalidateQueries({ queryKey: ['worker-stats'] });
        },
    });

    return {
        workers: data?.workers || [],
        pagination: {
            total: data?.total || 0,
            page: data?.page || 1,
            limit: data?.limit || 50,
            totalPages: data?.totalPages || 0,
        },
        isLoading,
        error,
        createWorker: createMutation.mutateAsync,
        createWorkerWithAuth: createWithAuthMutation.mutateAsync,
        updateWorker: updateMutation.mutateAsync,
        deleteWorker: deleteMutation.mutateAsync,
        deleteWorkers: deleteBatchMutation.mutateAsync,
    };
}

export function useWorkerStats(ministryIds?: string[]) {
    return useQuery({
        queryKey: ['worker-stats', ministryIds],
        queryFn: () => getWorkerStats(ministryIds),
        staleTime: 60_000, // stats can be slightly stale
    });
}
