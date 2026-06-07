'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMealStubs, createMealStub, updateMealStub, deleteMealStub } from '@/actions/db';

export function useMealStubs(filters: { workerId?: string; dateFrom?: Date; dateTo?: Date; enabled?: boolean } = {}) {
    const queryClient = useQueryClient();
    const { enabled = true, ...queryFilters } = filters;

    const { data, isLoading, error } = useQuery({
        queryKey: ['meal-stubs', queryFilters],
        queryFn: () => getMealStubs(queryFilters),
        staleTime: 30_000,
        enabled,
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await createMealStub(data);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meal-stubs'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await updateMealStub(id, data);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meal-stubs'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await deleteMealStub(id);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meal-stubs'] });
        },
    });

    return {
        mealStubs: data || [],
        isLoading,
        error,
        createMealStub: createMutation.mutateAsync,
        updateMealStub: updateMutation.mutateAsync,
        deleteMealStub: deleteMutation.mutateAsync,
    };
}
