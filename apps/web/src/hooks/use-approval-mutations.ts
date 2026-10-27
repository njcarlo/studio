'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateApproval } from '@/actions/db';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/use-user-role';
import type { ApprovalRequest } from '@/lib/types';

/**
 * Hook for approval-related mutations.
 * Centralizes multi-stage approval logic, actor authorization, and side-effects.
 */
export function useApprovalMutations() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { workerProfile } = useUserRole();

    const updateStatusMutation = useMutation({
        mutationFn: async ({
            request,
            status,
            options = {},
            reason,
        }: {
            request: ApprovalRequest;
            status: string;
            options?: {
                outgoingApproved?: boolean;
            };
            reason?: string;
        }) => {
            if (!request.id) throw new Error('Missing request ID');

            const updateData: any = { status };
            if (options.outgoingApproved !== undefined) {
                updateData.outgoingApproved = options.outgoingApproved;
            }
            if (reason) {
                updateData.reason = reason;
            }

            return await updateApproval(request.id, updateData, workerProfile?.id);
        },
        onMutate: async ({ request, status }) => {
            await queryClient.cancelQueries({ queryKey: ['approvals'] });
            const previousApprovals = queryClient.getQueriesData({ queryKey: ['approvals'] });

            // Optimistically update approval status across all approval queries
            queryClient.setQueriesData({ queryKey: ['approvals'] }, (old: any) => {
                if (!Array.isArray(old)) return old;
                return old.map((r: any) => (r.id === request.id ? { ...r, status } : r));
            });

            return { previousApprovals };
        },
        onSuccess: (data: any, variables) => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
            queryClient.invalidateQueries({ queryKey: ['bookings'] });

            const isRoom = variables?.request?.type === 'Room Booking' || data?.type === 'Room Booking';
            const status = variables?.status || data?.status;

            if (status === 'Approved' && isRoom) {
                toast({
                    title: 'Reservation Approved',
                    description: 'Room reservation has been successfully approved and reserved.',
                });
            } else if (status === 'Rejected' && isRoom) {
                toast({
                    title: 'Reservation Rejected',
                    description: 'Reservation request has been rejected.',
                });
            } else if (status === 'Pending Admin Approval') {
                toast({
                    title: 'Ministry Head Approval Recorded',
                    description: 'Request has been forwarded to System Admin for final approval.',
                });
            } else {
                toast({
                    title: `Request ${status || 'Updated'}`,
                    description: `Successfully updated the status of the request.`,
                });
            }
        },
        onError: (error: any, _variables, context: any) => {
            if (context?.previousApprovals) {
                context.previousApprovals.forEach(([queryKey, data]: [any, any]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
            console.error('Approval update error:', error);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error?.message || 'Could not update the approval request.',
            });
        },
    });

    return {
        updateStatus: updateStatusMutation.mutate,
        isUpdating: updateStatusMutation.isPending,
    };
}
