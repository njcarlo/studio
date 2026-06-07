'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSetting, updateSetting } from '@/actions/db';

export function useSettings(id: string) {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['settings', id],
        queryFn: () => getSetting(id),
    });

    const updateMutation = useMutation({
        mutationFn: async (newData: any) => {
            const res = await updateSetting(id, newData);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
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
