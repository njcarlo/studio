'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getEvents, getEvent, createEvent, updateEvent, deleteEvent,
    addEventRoom, updateEventRoom, removeEventRoom,
    upsertEventAssignment, deleteEventAssignment,
    addEventEquipment, updateEventEquipment, removeEventEquipment,
} from '@/actions/events';

export function useEvents(status?: string) {
    const qc = useQueryClient();
    const query = useQuery({
        queryKey: ['events', status],
        queryFn: () => getEvents(status ? { status } : {}),
        staleTime: 30_000,
    });
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => { const res = await deleteEvent(id); if (!res.success) throw new Error(res.error); return res.data; },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
    });
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => { const res = await updateEvent(id, data); if (!res.success) throw new Error(res.error); return res.data; },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
    });
    return {
        events: query.data ?? [],
        isLoading: query.isLoading,
        error: query.error,
        updateEvent: updateMutation.mutateAsync,
        deleteEvent: deleteMutation.mutateAsync,
    };
}

export function useEvent(id: string) {
    const qc = useQueryClient();
    const key = ['event', id];
    const query = useQuery({
        queryKey: key,
        queryFn: () => getEvent(id),
        enabled: !!id,
        staleTime: 15_000,
    });

    const inv = () => qc.invalidateQueries({ queryKey: key });

    const updateMutation        = useMutation({ mutationFn: async (data: any) => { const res = await updateEvent(id, data); if (!res.success) throw new Error(res.error); return res.data; }, onSuccess: inv });
    const addRoomMutation       = useMutation({ mutationFn: async (data: any) => { const res = await addEventRoom(data); if (!res.success) throw new Error(res.error); return res.data; }, onSuccess: inv });
    const updateRoomMutation    = useMutation({ mutationFn: async ({ bid, data }: any) => { const res = await updateEventRoom(bid, id, data); if (!res.success) throw new Error(res.error); return res.data; }, onSuccess: inv });
    const removeRoomMutation    = useMutation({ mutationFn: async (bid: string) => { const res = await removeEventRoom(bid, id); if (!res.success) throw new Error(res.error); return res.data; }, onSuccess: inv });
    const upsertAssignMutation  = useMutation({ mutationFn: async (data: any) => { const res = await upsertEventAssignment(data); if (!res.success) throw new Error(res.error); return res.data; }, onSuccess: inv });
    const deleteAssignMutation  = useMutation({ mutationFn: async (aid: string) => { const res = await deleteEventAssignment(aid, id); if (!res.success) throw new Error(res.error); return res.data; }, onSuccess: inv });
    const addEquipMutation      = useMutation({ mutationFn: async (data: any) => { const res = await addEventEquipment(data); if (!res.success) throw new Error(res.error); return res.data; }, onSuccess: inv });
    const updateEquipMutation   = useMutation({ mutationFn: async ({ eid, data }: any) => { const res = await updateEventEquipment(eid, id, data); if (!res.success) throw new Error(res.error); return res.data; }, onSuccess: inv });
    const removeEquipMutation   = useMutation({ mutationFn: async (eid: string) => { const res = await removeEventEquipment(eid, id); if (!res.success) throw new Error(res.error); return res.data; }, onSuccess: inv });

    return {
        event: query.data ?? null,
        isLoading: query.isLoading,
        updateEvent:        updateMutation.mutateAsync,
        addRoom:            addRoomMutation.mutateAsync,
        updateRoom:         updateRoomMutation.mutateAsync,
        removeRoom:         removeRoomMutation.mutateAsync,
        upsertAssignment:   upsertAssignMutation.mutateAsync,
        deleteAssignment:   deleteAssignMutation.mutateAsync,
        addEquipment:       addEquipMutation.mutateAsync,
        updateEquipment:    updateEquipMutation.mutateAsync,
        removeEquipment:    removeEquipMutation.mutateAsync,
    };
}
