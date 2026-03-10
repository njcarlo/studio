'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAttendanceRecords, createAttendanceRecord } from '@/actions/db';

export function useAttendance(filters: { workerProfileId?: string; dateFrom?: Date } = {}) {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['attendance', filters],
        queryFn: () => getAttendanceRecords(filters),
    });

    const createMutation = useMutation({
        mutationFn: createAttendanceRecord,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
        },
    });

    return {
        attendanceRecords: data || [],
        isLoading,
        error,
        createAttendanceRecord: createMutation.mutateAsync,
    };
}
