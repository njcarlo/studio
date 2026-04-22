import { ApprovalRequest } from '@studio/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApprovals, createApproval, updateApproval } from '@/actions/db';

export function useApprovals() {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['approvals'],
        queryFn: () => getApprovals(),
        refetchInterval: 3000, // Auto-refresh every 3 seconds for real-time updates
        refetchOnWindowFocus: true, // Refresh when user returns to tab
        staleTime: 0, // Always consider data stale to ensure fresh data
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
