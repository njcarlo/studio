'use client'

import { Room, Area, Branch } from '@studio/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsClient } from '@/lib/studio-client'
import {
  createRooms, updateArea, deleteArea, createAreas,
  updateBranch, deleteBranch,
} from '@/actions/db'

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
  const createRoomsMutation = useMutation({
    mutationFn: (data: any[]) => createRooms(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  })
  const createAreaMutation = useMutation({
    mutationFn: (data: any) => settingsClient.createArea(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['areas'] }),
  })
  const updateAreaMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateArea(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['areas'] }),
  })
  const deleteAreaMutation = useMutation({
    mutationFn: (id: string) => deleteArea(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['areas'] }),
  })
  const createAreasMutation = useMutation({
    mutationFn: (data: any[]) => createAreas(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['areas'] }),
  })
  const createBranchMutation = useMutation({
    mutationFn: (data: any) => settingsClient.createBranch(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches'] }),
  })
  const updateBranchMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateBranch(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches'] }),
  })
  const deleteBranchMutation = useMutation({
    mutationFn: (id: string) => deleteBranch(id),
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
    createRooms:  createRoomsMutation.mutateAsync,
    createArea:   createAreaMutation.mutateAsync,
    updateArea:   updateAreaMutation.mutateAsync,
    deleteArea:   deleteAreaMutation.mutateAsync,
    createAreas:  createAreasMutation.mutateAsync,
    createBranch: createBranchMutation.mutateAsync,
    updateBranch: updateBranchMutation.mutateAsync,
    deleteBranch: deleteBranchMutation.mutateAsync,
  }
}
