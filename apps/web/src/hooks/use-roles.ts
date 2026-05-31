'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsClient } from '@/lib/studio-client'

export function useRoles() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['roles'],
    queryFn: () => settingsClient.getRoles(),
    staleTime: 5 * 60_000,
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => settingsClient.createRole(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => settingsClient.updateRole(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => settingsClient.deleteRole(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  })

  return {
    roles: (data as any[]) || [],
    isLoading,
    error,
    createRole: createMutation.mutateAsync,
    updateRole: updateMutation.mutateAsync,
    deleteRole: deleteMutation.mutateAsync,
  }
}
