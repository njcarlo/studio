'use client';

import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { ReactNode, useState, useMemo } from 'react';

export function ReactQueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 5 * 60 * 1000,   // 5 minutes stale time for instant 0ms loads
                        gcTime: 24 * 60 * 60 * 1000,// Retain in cache for 24 hours
                        refetchOnWindowFocus: false,// Prevent wasteful background refetches when switching tabs
                        refetchOnReconnect: true,   // Revalidate when network reconnects
                        retry: 1,
                    },
                },
            }),
    );

    const persister = useMemo(() => {
        if (typeof window === 'undefined') return undefined;
        try {
            return createSyncStoragePersister({
                storage: window.localStorage,
                key: 'COG_REACT_QUERY_CACHE_V1',
                throttleTime: 1000,
            });
        } catch {
            return undefined;
        }
    }, []);

    if (!persister) {
        return (
            <PersistQueryClientProvider
                client={queryClient}
                persistOptions={{ persister: { persistClient: () => {}, restoreClient: () => undefined, removeClient: () => {} } }}
            >
                {children}
            </PersistQueryClientProvider>
        );
    }

    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
                persister,
                maxAge: 24 * 60 * 60 * 1000,
                buster: 'cog-v1',
            }}
        >
            {children}
        </PersistQueryClientProvider>
    );
}

