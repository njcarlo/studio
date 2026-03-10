'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMealStubs, createMealStub, updateMealStub, deleteMealStub } from '@/actions/db';

export function useMealStubs(filters: { workerId?: string; dateFrom?: Date } = {}) {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['meal-stubs', filters],
        queryFn: () => getMealStubs(filters),
    });

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
