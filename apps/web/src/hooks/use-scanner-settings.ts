'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getScannerSettings, updateScannerSettings } from '@/actions/db';
import { type ScannerSettings, DEFAULT_SCANNER_SETTINGS } from '@/lib/scanner-config';

export function useScannerSettings() {
    const queryClient = useQueryClient();

    const { data: settings, isLoading, error } = useQuery({
        queryKey: ['scanner-settings'],
        queryFn: () => getScannerSettings(),
    });

    const mutation = useMutation({
        mutationFn: (newSettings: Partial<ScannerSettings>) => updateScannerSettings(newSettings),
        onSuccess: (updated) => {
            queryClient.setQueryData(['scanner-settings'], updated);
            queryClient.invalidateQueries({ queryKey: ['scanner-settings'] });
        },
    });

    return {
        settings: settings || DEFAULT_SCANNER_SETTINGS,
        isLoading,
        error,
        updateSettings: mutation.mutateAsync,
        isSaving: mutation.isPending,
    };
}
