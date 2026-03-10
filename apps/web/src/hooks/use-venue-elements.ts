'use client';
import { VenueElement } from '@studio/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVenueElements, createVenueElement, updateVenueElement, deleteVenueElement } from '@/actions/db';

export function useVenueElements() {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['venueElements'],
        queryFn: () => getVenueElements(),
    });

    const createMutation = useMutation({
        mutationFn: createVenueElement,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['venueElements'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateVenueElement(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['venueElements'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteVenueElement,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['venueElements'] });
        },
    });

    return {
        venueElements: (data?.map(e => ({
            ...e,
            category: e.category as any
        })) as VenueElement[]) || [],
        isLoading,
        error,
        createVenueElement: createMutation.mutateAsync,
        updateVenueElement: updateMutation.mutateAsync,
        deleteVenueElement: deleteMutation.mutateAsync,
    };
}
