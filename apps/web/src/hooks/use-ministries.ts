'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMinistries, createMinistry, updateMinistry, deleteMinistry } from '@/actions/db';
import { assignMinistryManager as assignMinistryManagerAction } from '@/actions/ministry-categories';
import { useUserRole } from '@/hooks/use-user-role';

export function useMinistries() {
    const queryClient = useQueryClient();
    const { workerProfile } = useUserRole();
    const callerId = workerProfile?.id || '';

    const { data, isLoading, error } = useQuery({
        queryKey: ['ministries'],
        queryFn: () => getMinistries(),
        staleTime: 5 * 60_000, // ministries rarely change — cache for 5 min
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await createMinistry(data);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ministries'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await updateMinistry(id, data);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ministries'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await deleteMinistry(id);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ministries'] });
        },
    });

    const assignManagerMutation = useMutation({
        mutationFn: async ({ ministryId, managerId }: { ministryId: string; managerId: string | null }) => {
            const res = await assignMinistryManagerAction(ministryId, managerId);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ministries'] });
        },
    });

    return {
        ministries: data || [],
        isLoading,
        error,
        createMinistry: createMutation.mutateAsync,
        updateMinistry: updateMutation.mutateAsync,
        deleteMinistry: deleteMutation.mutateAsync,
        assignMinistryManager: assignManagerMutation.mutateAsync,
    };
}
