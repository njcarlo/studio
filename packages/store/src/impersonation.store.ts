'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

const SESSION_STORAGE_KEY = 'impersonatedWorkerId';

/**
 * Impersonation store — replaces ImpersonationProvider Context.
 * Persists the impersonated worker ID in sessionStorage so it
 * survives page navigations but is cleared when the tab closes.
 */
export interface ImpersonationState {
    impersonatedWorkerId: string | null;

    startImpersonation: (workerId: string) => void;
    stopImpersonation: () => void;
}

export const useImpersonationStore = create<ImpersonationState>()(
    devtools(
        persist(
            (set) => ({
                // Read initial value from sessionStorage (hydrated by the persist middleware)
                impersonatedWorkerId: null,

                startImpersonation: (workerId) =>
                    set(
                        { impersonatedWorkerId: workerId },
                        false,
                        'impersonation/start'
                    ),

                stopImpersonation: () =>
                    set(
                        { impersonatedWorkerId: null },
                        false,
                        'impersonation/stop'
                    ),
            }),
            {
                name: SESSION_STORAGE_KEY,
                // Use sessionStorage so impersonation state is cleared on tab close
                storage: {
                    getItem: (key) => {
                        if (typeof window === 'undefined') return null;
                        const item = sessionStorage.getItem(key);
                        return item ? JSON.parse(item) : null;
                    },
                    setItem: (key, value) => {
                        if (typeof window === 'undefined') return;
                        sessionStorage.setItem(key, JSON.stringify(value));
                    },
                    removeItem: (key) => {
                        if (typeof window === 'undefined') return;
                        sessionStorage.removeItem(key);
                    },
                },
            }
        ),
        { name: 'ImpersonationStore' }
    )
);
