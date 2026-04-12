'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRoles, createRole, updateRole, deleteRole } from '@/actions/db';

export function useRoles() {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['roles'],
        queryFn: () => getRoles(),
        staleTime: 5 * 60_000, // roles rarely change — cache for 5 min
    });

    const createMutation = useMutation({
        mutationFn: createRole,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateRole(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteRole,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
        },
    });

    return {
        roles: data || [],
        isLoading,
        error,
        createRole: createMutation.mutateAsync,
        updateRole: updateMutation.mutateAsync,
        deleteRole: deleteMutation.mutateAsync,
    };
}
