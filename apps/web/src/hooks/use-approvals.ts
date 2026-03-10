import { ApprovalRequest } from '@studio/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApprovals, createApproval, updateApproval } from '@/actions/db';

export function useApprovals() {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['approvals'],
        queryFn: () => getApprovals(),
    });

    const createMutation = useMutation({
        mutationFn: createApproval,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateApproval(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
        },
    });

    return {
        approvals: (data as ApprovalRequest[]) || [],
        isLoading,
        error,
        createApproval: createMutation.mutateAsync,
        updateApproval: updateMutation.mutateAsync,
    };
}
