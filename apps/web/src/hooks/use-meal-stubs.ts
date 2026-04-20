'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMealStubs, createMealStub, updateMealStub, deleteMealStub } from '@/actions/db';

export function useMealStubs(filters: { workerId?: string; dateFrom?: Date; enabled?: boolean } = {}) {
    const queryClient = useQueryClient();
    const { enabled = true, ...queryFilters } = filters;

    const { data, isPending, isFetching, error } = useQuery({
        queryKey: ['meal-stubs', queryFilters],
        queryFn: () => getMealStubs(queryFilters),
        enabled: enabled,
    });

    // When enabled=false, isPending is true but we shouldn't show a loader
    const isLoading = enabled && isPending;

    const createMutation = useMutation({
        mutationFn: createMealStub,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meal-stubs'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateMealStub(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meal-stubs'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteMealStub,
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
