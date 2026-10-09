'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export function ReactQueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 2 * 60 * 1000,   // 2 minutes default stale time for instant 0ms navigation
                        gcTime: 15 * 60 * 1000,     // Retain unused data in cache for 15 minutes
                        refetchOnWindowFocus: false,// Prevent wasteful background refetches when switching tabs
                        refetchOnReconnect: true,   // Revalidate when network reconnects
                        retry: 1,
                    },
                },
            }),
    );

    return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
}
