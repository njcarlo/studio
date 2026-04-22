'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSetting, updateSetting } from '@/actions/db';

export function useSettings(id: string) {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['settings', id],
        queryFn: () => getSetting(id),
        staleTime: 5 * 60_000,
    });

    const updateMutation = useMutation({
        mutationFn: (newData: any) => updateSetting(id, newData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings', id] });
        },
    });

    return {
        settings: data,
        isLoading,
        error,
        updateSettings: updateMutation.mutateAsync,
    };
}
