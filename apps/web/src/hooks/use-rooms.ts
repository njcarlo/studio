'use client'

import { Room, Area, Branch, RoomDisplayDevice } from '@studio/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getRooms, createRoom, updateRoom, deleteRoom,
  getAreas, createArea, createRooms, updateArea, deleteArea, createAreas,
  getBranches, createBranch, updateBranch, deleteBranch,
  getRoomDisplayDevices, createRoomDisplayDevice, updateRoomDisplayDevice,
  deleteRoomDisplayDevice, regenerateRoomDisplayDeviceToken,
} from '@/actions/db'

export function useRooms() {
  const queryClient = useQueryClient()

  const roomsQuery    = useQuery({ queryKey: ['rooms'],    queryFn: () => getRooms() })
  const areasQuery    = useQuery({ queryKey: ['areas'],    queryFn: () => getAreas() })
  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: () => getBranches() })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await createRoom(data);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  })
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await updateRoom(id, data);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  })
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteRoom(id);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  })
  const createRoomsMutation = useMutation({
    mutationFn: async (data: any[]) => {
      const res = await createRooms(data);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  })
  const createAreaMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await createArea(data);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['areas'] }),
  })
  const updateAreaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await updateArea(id, data);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['areas'] }),
  })
  const deleteAreaMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteArea(id);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['areas'] }),
  })
  const createAreasMutation = useMutation({
    mutationFn: async (data: any[]) => {
      const res = await createAreas(data);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['areas'] }),
  })
  const createBranchMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await createBranch(data);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches'] }),
  })
  const updateBranchMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await updateBranch(id, data);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches'] }),
  })
  const deleteBranchMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteBranch(id);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches'] }),
  })

  // --- Room Display Devices ---
  const displayDevicesQuery = useQuery({
    queryKey: ['room-display-devices'],
    queryFn: async () => {
      const res = await getRoomDisplayDevices();
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  })
  const createDisplayDeviceMutation = useMutation({
    mutationFn: async (data: { name: string; roomId?: string | null }) => {
      const res = await createRoomDisplayDevice(data);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['room-display-devices'] }),
  })
  const updateDisplayDeviceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; roomId?: string | null } }) => {
      const res = await updateRoomDisplayDevice(id, data);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['room-display-devices'] }),
  })
  const regenerateDisplayDeviceTokenMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await regenerateRoomDisplayDeviceToken(id);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['room-display-devices'] }),
  })
  const deleteDisplayDeviceMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteRoomDisplayDevice(id);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['room-display-devices'] }),
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

    displayDevices: (displayDevicesQuery.data || []) as (RoomDisplayDevice & { room: Room | null })[],
    displayDevicesLoading: displayDevicesQuery.isLoading,
    createDisplayDevice: createDisplayDeviceMutation.mutateAsync,
    updateDisplayDevice: updateDisplayDeviceMutation.mutateAsync,
    regenerateDisplayDeviceToken: regenerateDisplayDeviceTokenMutation.mutateAsync,
    deleteDisplayDevice: deleteDisplayDeviceMutation.mutateAsync,
  }
}
