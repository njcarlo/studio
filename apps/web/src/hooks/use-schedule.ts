'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getServiceSchedules, getServiceSchedule,
    createServiceSchedule, updateServiceSchedule, deleteServiceSchedule,
    upsertAssignment, deleteAssignment, applyTemplateToSchedule,
    getServiceTemplates, createServiceTemplate, updateServiceTemplate, deleteServiceTemplate,
    publishScheduleAndNotify, confirmAssignment, getScheduleConfirmationStatus, findWorkerByWorkerId,
    getWorkerConflicts, togglePublicSchedule, getScheduleHistory, setAttendanceStatus,
    getWorshipSlots, createWorshipSlot, updateWorshipSlot, deleteWorshipSlot,
    addWorkerToWorshipSlot, removeWorkerFromWorshipSlot,
} from '@/actions/schedule';

export function useServiceSchedules() {
    const qc = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['service-schedules'],
        queryFn: () => getServiceSchedules(),
    });

    const createMutation = useMutation({
        mutationFn: createServiceSchedule,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['service-schedules'] }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateServiceSchedule(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['service-schedules'] }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteServiceSchedule,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['service-schedules'] }),
    });

    return {
        schedules: data || [],
        isLoading,
        createSchedule: createMutation.mutateAsync,
        updateSchedule: updateMutation.mutateAsync,
        deleteSchedule: deleteMutation.mutateAsync,
    };
}

export function useServiceSchedule(id: string) {
    const qc = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['service-schedule', id],
        queryFn: () => getServiceSchedule(id),
        enabled: !!id,
    });

    const upsertMutation = useMutation({
        mutationFn: upsertAssignment,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['service-schedule', id] }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteAssignment,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['service-schedule', id] }),
    });

    const applyTemplateMutation = useMutation({
        mutationFn: ({ templateId }: { templateId: string }) =>
            applyTemplateToSchedule(id, templateId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['service-schedule', id] }),
    });

    const publishMutation = useMutation({
        mutationFn: ({ publishedBy }: { publishedBy: string }) =>
            publishScheduleAndNotify(id, publishedBy),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['service-schedule', id] });
            qc.invalidateQueries({ queryKey: ['service-schedules'] });
        },
    });

    const confirmMutation = useMutation({
        mutationFn: ({ assignmentId, confirmedBy }: { assignmentId: string; confirmedBy: string }) =>
            confirmAssignment(assignmentId, confirmedBy),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['service-schedule', id] }),
    });

    const setStatusMutation = useMutation({
        mutationFn: ({ assignmentId, status, updatedBy }: { assignmentId: string; status: 'Confirmed' | 'Pending' | 'Not Attending'; updatedBy: string }) =>
            setAttendanceStatus(assignmentId, status, updatedBy),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['service-schedule', id] });
            qc.invalidateQueries({ queryKey: ['schedule-confirmation', id] });
        },
    });

    const { data: confirmationStatus } = useQuery({
        queryKey: ['schedule-confirmation', id],
        queryFn: () => getScheduleConfirmationStatus(id),
        enabled: !!id,
    });

    const { data: conflictsData } = useQuery({
        queryKey: ['schedule-conflicts', id],
        queryFn: () => getWorkerConflicts(id),
        enabled: !!id,
    });

    const togglePublicMutation = useMutation({
        mutationFn: ({ isPublic }: { isPublic: boolean }) => togglePublicSchedule(id, isPublic),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['service-schedule', id] });
            qc.invalidateQueries({ queryKey: ['service-schedules'] });
        },
    });

    return {
        schedule: data,
        isLoading,
        conflicts: conflictsData || [],
        confirmationStatus: confirmationStatus || [],
        upsertAssignment: upsertMutation.mutateAsync,
        deleteAssignment: deleteMutation.mutateAsync,
        applyTemplate: applyTemplateMutation.mutateAsync,
        isApplyingTemplate: applyTemplateMutation.isPending,
        publishSchedule: publishMutation.mutateAsync,
        isPublishing: publishMutation.isPending,
        confirmAssignment: confirmMutation.mutateAsync,
        setAttendanceStatus: setStatusMutation.mutateAsync,
        togglePublic: togglePublicMutation.mutateAsync,
    };
}

export function useServiceTemplates(ministryId?: string) {
    const qc = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['service-templates', ministryId],
        queryFn: () => getServiceTemplates(ministryId),
    });

    const createMutation = useMutation({
        mutationFn: createServiceTemplate,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['service-templates'] }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateServiceTemplate(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['service-templates'] }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteServiceTemplate,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['service-templates'] }),
    });

    return {
        templates: data || [],
        isLoading,
        createTemplate: createMutation.mutateAsync,
        updateTemplate: updateMutation.mutateAsync,
        deleteTemplate: deleteMutation.mutateAsync,
    };
}

export function useScheduleHistory() {
    return useQuery({
        queryKey: ['schedule-history'],
        queryFn: () => getScheduleHistory(),
    });
}

export function useWorshipSlots(scheduleId: string) {
    const qc = useQueryClient();
    const key = ['worship-slots', scheduleId];

    const { data, isLoading } = useQuery({
        queryKey: key,
        queryFn: () => getWorshipSlots(scheduleId),
        enabled: !!scheduleId,
    });

    const createMutation = useMutation({
        mutationFn: (d: { slotName: string; notes?: string; order?: number }) =>
            createWorshipSlot({ scheduleId, ...d }),
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { slotName?: string; notes?: string } }) =>
            updateWorshipSlot(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteWorshipSlot,
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });

    const addWorkerMutation = useMutation({
        mutationFn: ({ slotId, workerId, workerName, role }: { slotId: string; workerId: string; workerName: string; role?: string }) =>
            addWorkerToWorshipSlot(slotId, workerId, workerName, role),
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });

    const removeWorkerMutation = useMutation({
        mutationFn: removeWorkerFromWorshipSlot,
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });

    return {
        slots: data || [],
        isLoading,
        createSlot: createMutation.mutateAsync,
        updateSlot: updateMutation.mutateAsync,
        deleteSlot: deleteMutation.mutateAsync,
        addWorker: addWorkerMutation.mutateAsync,
        removeWorker: removeWorkerMutation.mutateAsync,
    };
}
