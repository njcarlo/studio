'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePermissionsStore } from '@studio/store';
import { useShallow } from 'zustand/react/shallow';
import { getApprovals, createApproval, updateApproval } from '@/actions/db';

export function useApprovals(options: { enabled?: boolean } = {}) {
    const queryClient = useQueryClient();
    const { isSuperAdmin, myMinistryIds, workerProfile } = usePermissionsStore(
        useShallow(s => ({
            isSuperAdmin: s.isSuperAdmin,
            myMinistryIds: s.myMinistryIds,
            workerProfile: s.workerProfile,
        }))
    );

    const scope = { workerId: workerProfile?.id, ministryIds: myMinistryIds, isSuperAdmin };

    const { data, isLoading, error } = useQuery({
        queryKey: ['approvals', scope],
        queryFn: () => getApprovals(scope),
        staleTime: 2 * 60_000,
        enabled: options?.enabled !== false,
    });

    const createMutation = useMutation({
        mutationFn: createApproval,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await updateApproval(id, data);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
        },
    });

    return {
        approvals: (data as any[]) || [],
        isLoading,
        error,
        createApproval: createMutation.mutateAsync,
        updateApproval: updateMutation.mutateAsync,
    };
}
