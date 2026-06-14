'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getMyAvailability,
    setRecurringUnavailability,
    addOneTimeUnavailability,
    removeUnavailability,
} from '@/actions/availability';

export function useMyAvailability() {
    const qc = useQueryClient();
    const key = ['my-availability'];

    const { data, isLoading } = useQuery({
        queryKey: key,
        queryFn: async () => {
            const res = await getMyAvailability();
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
    });

    const setRecurringMutation = useMutation({
        mutationFn: async (days: number[]) => {
            const res = await setRecurringUnavailability(days);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });

    const addOneTimeMutation = useMutation({
        mutationFn: async ({ date, note }: { date: Date; note?: string }) => {
            const res = await addOneTimeUnavailability(date, note);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });

    const removeMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await removeUnavailability(id);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });

    const availability = data || [];
    const recurringDays = availability
        .filter((a: any) => a.type === 'Recurring')
        .map((a: any) => a.dayOfWeek as number);
    const oneTimeBlocks = availability.filter((a: any) => a.type === 'OneTime');

    return {
        isLoading,
        recurringDays,
        oneTimeBlocks,
        setRecurringDays: setRecurringMutation.mutateAsync,
        addOneTimeBlock: addOneTimeMutation.mutateAsync,
        removeBlock: removeMutation.mutateAsync,
    };
}
