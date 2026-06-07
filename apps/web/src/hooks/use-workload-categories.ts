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
        mutationFn: async (args: { data: { name: string; description?: string } }) => {
            const res = await createWorkloadCategory({ ministryId, ...args.data });
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: { name?: string; description?: string } }) => {
            const res = await updateWorkloadCategory(id, data);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await deleteWorkloadCategory(id);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    const reorderMutation = useMutation({
        mutationFn: async (orderedIds: string[]) => {
            const res = await reorderWorkloadCategories({ ministryId, orderedIds });
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    return {
        categories,
        isLoading,
        error,
        createCategory: (data: { name: string; description?: string }) =>
            createMutation.mutateAsync({ data }),
        updateCategory: updateMutation.mutateAsync,
        deleteCategory: deleteMutation.mutateAsync,
        reorderCategories: reorderMutation.mutateAsync,
    };
}
