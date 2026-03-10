'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateApproval } from '@/actions/db';
import { useToast } from '@/hooks/use-toast';
import type { ApprovalRequest } from '@/lib/types';

/**
 * Hook for approval-related mutations.
 * Centralizes multi-stage approval logic and side-effects.
 */
export function useApprovalMutations() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const updateStatusMutation = useMutation({
        mutationFn: async ({
            request,
            status,
            options = {},
        }: {
            request: ApprovalRequest;
            status: string;
            options?: {
                outgoingApproved?: boolean;
            };
        }) => {
            if (!request.id) throw new Error('Missing request ID');

            const updateData: any = { status };
            if (options.outgoingApproved !== undefined) {
                updateData.outgoingApproved = options.outgoingApproved;
            }

            return await updateApproval(request.id, updateData);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
            toast({
                title: `Request ${data.status}`,
                description: `Successfully updated the status of the request.`,
            });
        },
        onError: (error) => {
            console.error('Approval update error:', error);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Could not update the approval request.',
            });
        },
    });

    return {
        updateStatus: updateStatusMutation.mutate,
        isUpdating: updateStatusMutation.isPending,
    };
}
