'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkers, createWorker, updateWorker, deleteWorker, deleteWorkers } from '@/actions/db';

export function useWorkers() {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['workers'],
        queryFn: () => getWorkers(),
    });

    const createMutation = useMutation({
        mutationFn: createWorker,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workers'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateWorker(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workers'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteWorker,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workers'] });
        },
    });

    const deleteBatchMutation = useMutation({
        mutationFn: deleteWorkers,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workers'] });
        },
    });

    return {
        workers: data || [],
        isLoading,
        error,
        createWorker: createMutation.mutateAsync,
        updateWorker: updateMutation.mutateAsync,
        deleteWorker: deleteMutation.mutateAsync,
        deleteWorkers: deleteBatchMutation.mutateAsync,
    };
}
