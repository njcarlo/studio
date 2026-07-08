'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRoles, createRole, updateRole, deleteRole } from '@/actions/db'

export function useRoles() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['roles'],
    queryFn: () => getRoles(),
    staleTime: 5 * 60_000,
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await createRole(data);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  })
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await updateRole(id, data);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  })
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteRole(id);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
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
