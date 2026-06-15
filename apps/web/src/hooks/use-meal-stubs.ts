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
        // Optimistically add the stub so badges/buttons update instantly,
        // instead of waiting for the round trip + refetch.
        onMutate: async (newStub: any) => {
            await queryClient.cancelQueries({ queryKey: ['meal-stubs'] });
            const previous = queryClient.getQueriesData({ queryKey: ['meal-stubs'] });
            const optimisticStub = {
                id: `optimistic-${Date.now()}-${Math.random()}`,
                ...newStub,
                date: newStub.date ?? new Date(),
            };
            queryClient.setQueriesData({ queryKey: ['meal-stubs'] }, (old: any) =>
                old ? [optimisticStub, ...old] : old
            );
            return { previous };
        },
        onError: (_err, _vars, context) => {
            context?.previous?.forEach(([key, data]: any) => {
                queryClient.setQueryData(key, data);
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['meal-stubs'] });
            queryClient.invalidateQueries({ queryKey: ['meal-stub-logs'] });
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
        // Optimistically remove the stub so badges/buttons update instantly,
        // instead of waiting for the round trip + refetch.
        onMutate: async (id: string) => {
            await queryClient.cancelQueries({ queryKey: ['meal-stubs'] });
            const previous = queryClient.getQueriesData({ queryKey: ['meal-stubs'] });
            queryClient.setQueriesData({ queryKey: ['meal-stubs'] }, (old: any) =>
                old ? old.filter((s: any) => s.id !== id) : old
            );
            return { previous };
        },
        onError: (_err, _vars, context) => {
            context?.previous?.forEach(([key, data]: any) => {
                queryClient.setQueryData(key, data);
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['meal-stubs'] });
            queryClient.invalidateQueries({ queryKey: ['meal-stub-logs'] });
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
