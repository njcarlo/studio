'use client';

import { QueryClient } from '@tanstack/react-query';

/**
 * Global QueryClient instance for React Query.
 * Configured with sensible defaults for a Supabase/SQL-backed app:
 * - Refetch on focus is disabled to avoid noisy refreshes while editing forms.
 * - Retry is enabled for transient network errors.
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false, // Not needed as we use real-time listeners mostly
            staleTime: 1000 * 60 * 5, // 5 minutes
        },
        mutations: {
            retry: 2,
        },
    },
});
