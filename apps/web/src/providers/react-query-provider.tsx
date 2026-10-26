'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export function ReactQueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 5 * 60 * 1000,   // 5 minutes in memory = 0ms instant tab transitions
                        gcTime: 60 * 60 * 1000,     // 1 hour memory retention
                        refetchOnWindowFocus: false,// Never freeze when user taps or focuses window
                        refetchOnMount: false,      // Serve instantly from in-memory cache if data exists
                        refetchOnReconnect: false,  // Prevent network flood on reconnection
                        retry: 1,
                    },
                },
            }),
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}

