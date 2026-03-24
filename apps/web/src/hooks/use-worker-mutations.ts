'use client';

import { useMutation } from '@tanstack/react-query';
import { createWorker, updateWorker, deleteWorker } from '@/actions/db';
import { useToast } from '@/hooks/use-toast';
import type { Worker } from '@/lib/types';

/**
 * Hook for worker-related mutations.
 * Handles single worker updates, additions, deletions, and batch operations.
 */
export function useWorkerMutations() {
    const { toast } = useToast();

    const updateWorkerMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Worker> }) => {
            return updateWorker(id, data);
        },
        onSuccess: () => {
            toast({
                title: 'Worker Updated',
                description: 'The worker details have been successfully updated.',
            });
        },
        onError: (error) => {
            console.error('Update worker error:', error);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Could not update worker details.',
            });
        },
    });

    const addWorkerMutation = useMutation({
        mutationFn: async (data: Partial<Worker>) => {
            return createWorker(data);
        },
        onSuccess: () => {
            toast({
                title: 'Worker Added',
                description: 'Successfully added the new worker.',
            });
        },
        onError: (error) => {
            console.error('Add worker error:', error);
            toast({
                variant: 'destructive',
                title: 'Addition Failed',
                description: 'Could not add the new worker.',
            });
        },
    });

    const deleteWorkerMutation = useMutation({
        mutationFn: async (id: string) => {
            return deleteWorker(id);
        },
        onSuccess: () => {
            toast({
                title: 'Worker Deleted',
                description: 'The worker has been removed from the system.',
            });
        },
        onError: (error) => {
            console.error('Delete worker error:', error);
            toast({
                variant: 'destructive',
                title: 'Deletion Failed',
                description: 'Could not delete the worker.',
            });
        },
    });

    const batchUpdateMutation = useMutation({
        mutationFn: async ({
            workerIds,
            data,
        }: {
            workerIds: string[];
            data: Partial<Worker>;
        }) => {
            await Promise.all(workerIds.map((id) => updateWorker(id, data)));
        },
        onSuccess: (_, variables) => {
            toast({
                title: 'Batch Update Complete',
                description: `Successfully updated ${variables.workerIds.length} workers.`,
            });
        },
        onError: (error) => {
            console.error('Batch update error:', error);
            toast({
                variant: 'destructive',
                title: 'Batch Update Failed',
                description: 'Could not complete the bulk update.',
            });
        },
    });

    return {
        updateWorker: updateWorkerMutation.mutate,
        isUpdatingWorker: updateWorkerMutation.isPending,
        addWorker: addWorkerMutation.mutate,
        isAddingWorker: addWorkerMutation.isPending,
        deleteWorker: deleteWorkerMutation.mutate,
        isDeletingWorker: deleteWorkerMutation.isPending,
        batchUpdate: batchUpdateMutation.mutate,
        isBatchUpdating: batchUpdateMutation.isPending,
    };
}
