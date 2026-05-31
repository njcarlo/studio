'use client'

import { Room, Area, Branch } from '@studio/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsClient } from '@/lib/studio-client'

export function useRooms() {
  const queryClient = useQueryClient()

  const roomsQuery    = useQuery({ queryKey: ['rooms'],    queryFn: () => settingsClient.getRooms() })
  const areasQuery    = useQuery({ queryKey: ['areas'],    queryFn: () => settingsClient.getAreas() })
  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: () => settingsClient.getBranches() })

  const createMutation = useMutation({
    mutationFn: (data: any) => settingsClient.createRoom(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => settingsClient.updateRoom(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => settingsClient.deleteRoom(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  })
  const createAreaMutation = useMutation({
    mutationFn: (data: any) => settingsClient.createArea(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['areas'] }),
  })
  const createBranchMutation = useMutation({
    mutationFn: (data: any) => settingsClient.createBranch(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches'] }),
  })

  return {
    rooms:    ((roomsQuery.data    as any[]) || []) as Room[],
    areas:    ((areasQuery.data    as any[]) || []) as Area[],
    branches: ((branchesQuery.data as any[]) || []) as Branch[],
    isLoading: roomsQuery.isLoading || areasQuery.isLoading || branchesQuery.isLoading,
    error:     roomsQuery.error    || areasQuery.error    || branchesQuery.error,
    createRoom:   createMutation.mutateAsync,
    updateRoom:   updateMutation.mutateAsync,
    deleteRoom:   deleteMutation.mutateAsync,
    createArea:   createAreaMutation.mutateAsync,
    createBranch: createBranchMutation.mutateAsync,
  }
}
