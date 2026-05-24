'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    getWorkloadCategories, 
    createWorkloadCategory, 
    updateWorkloadCategory, 
    deleteWorkloadCategory, 
    reorderWorkloadCategories 
} from '@/actions/ministry-categories';
import { useUserRole } from '@/hooks/use-user-role';

export function useWorkloadCategories(ministryId: string) {
    const queryClient = useQueryClient();
    const { workerProfile } = useUserRole();
    const callerId = workerProfile?.id || '999999';

    const queryKey = ['workload-categories', ministryId];

    const { data: categories = [], isLoading, error } = useQuery({
        queryKey,
        queryFn: () => getWorkloadCategories(ministryId),
        staleTime: 2 * 60_000, // 2 minutes
        enabled: !!ministryId,
    });

    const createMutation = useMutation({
        mutationFn: (args: { data: { name: string; description?: string }, options?: { skipAuth?: boolean } }) => 
            createWorkloadCategory({ ministryId, ...args.data }, callerId, args.options),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string } }) => 
            updateWorkloadCategory(id, data, callerId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteWorkloadCategory(id, callerId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    const reorderMutation = useMutation({
        mutationFn: (orderedIds: string[]) => 
            reorderWorkloadCategories({ ministryId, orderedIds }, callerId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    return {
        categories,
        isLoading,
        error,
        createCategory: (data: { name: string; description?: string }, options?: { skipAuth?: boolean }) =>
            createMutation.mutateAsync({ data, options }),
        updateCategory: updateMutation.mutateAsync,
        deleteCategory: deleteMutation.mutateAsync,
        reorderCategories: reorderMutation.mutateAsync,
    };
}
