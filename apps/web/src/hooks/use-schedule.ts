'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getServiceSchedules, getServiceSchedule,
    createServiceSchedule, updateServiceSchedule, deleteServiceSchedule,
    upsertAssignment, deleteAssignment, applyTemplateToSchedule,
    getServiceTemplates, createServiceTemplate, updateServiceTemplate, deleteServiceTemplate,
    publishScheduleAndNotify, confirmAssignment, getScheduleConfirmationStatus, findWorkerByWorkerId,
    getWorkerConflicts, togglePublicSchedule, getScheduleHistory, setAttendanceStatus, reassignAssignment,
    getWorshipSlots, createWorshipSlot, updateWorshipSlot, deleteWorshipSlot,
    addWorkerToWorshipSlot, removeWorkerFromWorshipSlot,
    getMonthlyDutyCounts, getMyAssignments, getMyMealStubCounts, getSundayConfirmationWindow,
} from '@/actions/schedule';

export function useServiceSchedules() {
    const qc = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['service-schedules'],
        queryFn: () => getServiceSchedules(),
    });

    const createMutation = useMutation({
        mutationFn: async (args: Parameters<typeof createServiceSchedule>[0]) => {
            const res = await createServiceSchedule(args);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['service-schedules'] }),
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await updateServiceSchedule(id, data);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['service-schedules'] }),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await deleteServiceSchedule(id);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
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
        mutationFn: async (data: Parameters<typeof upsertAssignment>[0]) => {
            const res = await upsertAssignment(data);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['service-schedule', id] }),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await deleteAssignment(id);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['service-schedule', id] }),
    });

    const applyTemplateMutation = useMutation({
        mutationFn: async ({ templateId }: { templateId: string }) => {
            const res = await applyTemplateToSchedule(id, templateId);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['service-schedule', id] });
            qc.invalidateQueries({ queryKey: ['workload-categories'] });
        },
    });

    const publishMutation = useMutation({
        mutationFn: async ({ publishedBy }: { publishedBy: string }) => {
            const res = await publishScheduleAndNotify(id, publishedBy);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['service-schedule', id] });
            qc.invalidateQueries({ queryKey: ['service-schedules'] });
        },
    });

    const confirmMutation = useMutation({
        mutationFn: async ({ assignmentId, confirmedBy }: { assignmentId: string; confirmedBy: string }) => {
            const res = await confirmAssignment(assignmentId, confirmedBy);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['service-schedule', id] }),
    });

    const setStatusMutation = useMutation({
        mutationFn: async ({ assignmentId, status, updatedBy }: { assignmentId: string; status: 'Confirmed' | 'Pending' | 'Not Attending'; updatedBy: string }) => {
            const res = await setAttendanceStatus(assignmentId, status, updatedBy);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['service-schedule', id] });
            qc.invalidateQueries({ queryKey: ['schedule-confirmation', id] });
        },
    });

    const reassignMutation = useMutation({
        mutationFn: async ({ assignmentId, newWorkerId, newWorkerName }: { assignmentId: string; newWorkerId: string; newWorkerName: string }) => {
            const res = await reassignAssignment(assignmentId, newWorkerId, newWorkerName);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
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

    const { data: monthlyDutiesData } = useQuery({
        queryKey: ['schedule-monthly-duties', id],
        queryFn: () => getMonthlyDutyCounts(id),
        enabled: !!id,
    });

    const togglePublicMutation = useMutation({
        mutationFn: async ({ isPublic }: { isPublic: boolean }) => {
            const res = await togglePublicSchedule(id, isPublic);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['service-schedule', id] });
            qc.invalidateQueries({ queryKey: ['service-schedules'] });
        },
    });

    return {
        schedule: data,
        isLoading,
        conflicts: conflictsData || [],
        monthlyDuties: monthlyDutiesData || {},
        confirmationStatus: confirmationStatus || [],
        upsertAssignment: upsertMutation.mutateAsync,
        deleteAssignment: deleteMutation.mutateAsync,
        applyTemplate: applyTemplateMutation.mutateAsync,
        isApplyingTemplate: applyTemplateMutation.isPending,
        publishSchedule: publishMutation.mutateAsync,
        isPublishing: publishMutation.isPending,
        confirmAssignment: confirmMutation.mutateAsync,
        setAttendanceStatus: setStatusMutation.mutateAsync,
        reassignAssignment: reassignMutation.mutateAsync,
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
        mutationFn: async (args: Parameters<typeof createServiceTemplate>[0]) => {
            const res = await createServiceTemplate(args);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['service-templates'] });
            qc.invalidateQueries({ queryKey: ['workload-categories'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await updateServiceTemplate(id, data);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['service-templates'] });
            qc.invalidateQueries({ queryKey: ['workload-categories'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await deleteServiceTemplate(id);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
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
        mutationFn: async (d: { slotName: string; ministryId?: string | null; notes?: string; order?: number }) => {
            const res = await createWorshipSlot({ scheduleId, ...d });
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: { slotName?: string; notes?: string } }) => {
            const res = await updateWorshipSlot(id, data);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await deleteWorshipSlot(id);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });

    const addWorkerMutation = useMutation({
        mutationFn: async ({ slotId, workerId, workerName, role }: { slotId: string; workerId: string; workerName: string; role?: string }) => {
            const res = await addWorkerToWorshipSlot(slotId, workerId, workerName, role);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });

    const removeWorkerMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await removeWorkerFromWorshipSlot(id);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
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

export function useMySchedule(workerId?: string) {
    const qc = useQueryClient();
    const key = ['my-schedule', workerId];

    const { data, isLoading } = useQuery({
        queryKey: key,
        queryFn: () => getMyAssignments(workerId as string),
        enabled: !!workerId,
    });

    const assignments = data || [];
    const scheduleIds = [...new Set(assignments.map((a: any) => a.scheduleId))] as string[];

    const { data: stubCounts = {} } = useQuery({
        queryKey: ['my-meal-stub-counts', workerId, scheduleIds],
        queryFn: () => getMyMealStubCounts(workerId as string, scheduleIds),
        enabled: !!workerId && scheduleIds.length > 0,
    });

    const { data: confirmationWindow } = useQuery({
        queryKey: ['sunday-confirmation-window'],
        queryFn: () => getSundayConfirmationWindow(),
        staleTime: 5 * 60_000,
    });

    const confirmMutation = useMutation({
        mutationFn: async ({ assignmentId, confirmedBy }: { assignmentId: string; confirmedBy: string }) => {
            const res = await confirmAssignment(assignmentId, confirmedBy);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: key });
            qc.invalidateQueries({ queryKey: ['my-meal-stub-counts', workerId] });
        },
    });

    const setStatusMutation = useMutation({
        mutationFn: async ({ assignmentId, status, updatedBy }: { assignmentId: string; status: 'Confirmed' | 'Pending' | 'Not Attending'; updatedBy: string }) => {
            const res = await setAttendanceStatus(assignmentId, status, updatedBy);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: key });
            qc.invalidateQueries({ queryKey: ['my-meal-stub-counts', workerId] });
        },
    });

    return {
        assignments,
        isLoading,
        stubCounts,
        confirmationWindow,
        confirmAssignment: confirmMutation.mutateAsync,
        setAttendanceStatus: setStatusMutation.mutateAsync,
    };
}
