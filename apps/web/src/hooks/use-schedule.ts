'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getServiceSchedules, getServiceSchedule,
    createServiceSchedule, updateServiceSchedule, deleteServiceSchedule,
    upsertAssignment, deleteAssignment, applyTemplateToSchedule,
    getServiceTemplates, createServiceTemplate, updateServiceTemplate, deleteServiceTemplate,
    publishScheduleAndNotify, confirmAssignment, getScheduleConfirmationStatus, findWorkerByWorkerId,
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

    const { data: confirmationStatus } = useQuery({
        queryKey: ['schedule-confirmation', id],
        queryFn: () => getScheduleConfirmationStatus(id),
        enabled: !!id,
    });

    return {
        schedule: data,
        isLoading,
        confirmationStatus: confirmationStatus || [],
        upsertAssignment: upsertMutation.mutateAsync,
        deleteAssignment: deleteMutation.mutateAsync,
        applyTemplate: applyTemplateMutation.mutateAsync,
        isApplyingTemplate: applyTemplateMutation.isPending,
        publishSchedule: publishMutation.mutateAsync,
        isPublishing: publishMutation.isPending,
        confirmAssignment: confirmMutation.mutateAsync,
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
