'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { respondToApproval, decideApprovalStage } from '@/actions/db';
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

    const decideWorkflowMutation = useMutation({
        mutationFn: async ({ stageId, decision, reason }: { stageId: string; decision: 'approve' | 'reject'; reason?: string }) => {
            const res = await decideApprovalStage(stageId, decision, reason);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: (workflow) => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            const isPending = workflow.status === 'Pending';
            toast({
                title: isPending ? 'Forwarded for next approval' : `Request ${workflow.status}`,
                description: isPending
                    ? 'Moved to the next approval stage.'
                    : 'Successfully updated the status of the request.',
            });
        },
        onError: (error: any) => {
            console.error('Approval workflow decision error:', error);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error?.message || 'Could not update the approval request.',
            });
        },
    });

    return {
        respond: respondMutation.mutate,
        decideWorkflow: decideWorkflowMutation.mutate,
        isUpdating: respondMutation.isPending || decideWorkflowMutation.isPending,
    };
}
