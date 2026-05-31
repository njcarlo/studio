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
        mutationFn: deleteEvent,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateEvent(id, data),
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

    const updateMutation        = useMutation({ mutationFn: (data: any) => updateEvent(id, data), onSuccess: inv });
    const addRoomMutation       = useMutation({ mutationFn: addEventRoom, onSuccess: inv });
    const updateRoomMutation    = useMutation({ mutationFn: ({ bid, data }: any) => updateEventRoom(bid, id, data), onSuccess: inv });
    const removeRoomMutation    = useMutation({ mutationFn: (bid: string) => removeEventRoom(bid, id), onSuccess: inv });
    const upsertAssignMutation  = useMutation({ mutationFn: upsertEventAssignment, onSuccess: inv });
    const deleteAssignMutation  = useMutation({ mutationFn: (aid: string) => deleteEventAssignment(aid, id), onSuccess: inv });
    const addEquipMutation      = useMutation({ mutationFn: addEventEquipment, onSuccess: inv });
    const updateEquipMutation   = useMutation({ mutationFn: ({ eid, data }: any) => updateEventEquipment(eid, id, data), onSuccess: inv });
    const removeEquipMutation   = useMutation({ mutationFn: (eid: string) => removeEventEquipment(eid, id), onSuccess: inv });

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
