'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    getWorkers, 
    createWorker, 
    updateWorker, 
    deleteWorker, 
    deleteWorkers,
    getPaginatedWorkers,
    getWorkerStats
} from '@/actions/db';

export function useWorkers(params: {
    page?: number;
    limit?: number;
    search?: string;
    searchMode?: 'workerId' | 'name';
    ministryIds?: string[];
    status?: string;
    sortField?: string;
    sortDir?: 'asc' | 'desc';
    enabled?: boolean;
} = {}) {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['workers', params],
        queryFn: () => getPaginatedWorkers(params.page, params.limit, {
            search: params.search,
            searchMode: params.searchMode,
            ministryIds: params.ministryIds,
            status: params.status,
            sortField: params.sortField,
            sortDir: params.sortDir,
        }),
        staleTime: 60_000,
        placeholderData: (prev) => prev,
        enabled: params.enabled ?? true,
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await createWorker(data);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workers'] });
            queryClient.invalidateQueries({ queryKey: ['worker-stats'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await updateWorker(id, data);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workers'] });
            queryClient.invalidateQueries({ queryKey: ['worker-stats'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await deleteWorker(id);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workers'] });
            queryClient.invalidateQueries({ queryKey: ['worker-stats'] });
        },
    });

    const deleteBatchMutation = useMutation({
        mutationFn: async (ids: string[]) => {
            const res = await deleteWorkers(ids);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
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
