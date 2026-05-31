'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { respondToApproval } from '@/actions/db';
import { useToast } from '@/hooks/use-toast';

export function useApprovalMutations() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const respondMutation = useMutation({
        mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
            respondToApproval(id, action),
        onSuccess: ({ nextStatus }) => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
            const isPending = nextStatus.startsWith('Pending');
            toast({
                title: isPending ? 'Forwarded for next approval' : `Request ${nextStatus}`,
                description: isPending
                    ? `Moved to "${nextStatus}" stage.`
                    : `Successfully updated the status of the request.`,
            });
        },
        onError: (error: any) => {
            console.error('Approval update error:', error);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error?.message || 'Could not update the approval request.',
            });
        },
    });

    return {
        respond: respondMutation.mutate,
        isUpdating: respondMutation.isPending,
    };
}
