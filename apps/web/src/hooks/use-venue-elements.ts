'use client'

import { VenueElement } from '@studio/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsClient } from '@/lib/studio-client'

export function useVenueElements() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['venueElements'],
    queryFn: () => settingsClient.getVenueElements(),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => settingsClient.createVenueElement(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['venueElements'] }),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => settingsClient.updateVenueElement(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['venueElements'] }),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => settingsClient.deleteVenueElement(id),
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
