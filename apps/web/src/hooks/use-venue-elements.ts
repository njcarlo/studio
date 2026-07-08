'use client'

import { VenueElement } from '@studio/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getVenueElements, createVenueElement, updateVenueElement, deleteVenueElement } from '@/actions/db'

export function useVenueElements() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['venueElements'],
    queryFn: () => getVenueElements(),
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await createVenueElement(data);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['venueElements'] }),
  })
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await updateVenueElement(id, data);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['venueElements'] }),
  })
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteVenueElement(id);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['venueElements'] }),
  })

  return {
    venueElements: ((data as any[]) || []) as VenueElement[],
    isLoading,
    error,
    createVenueElement: createMutation.mutateAsync,
    updateVenueElement: updateMutation.mutateAsync,
    deleteVenueElement: deleteMutation.mutateAsync,
  }
}
