'use client';

/**
 * use-impersonation.tsx
 *
 * Backward-compatible thin wrapper around the Zustand ImpersonationStore.
 * All existing consumers using `useImpersonation()` continue to work without changes.
 *
 * sessionStorage persistence is handled by the Zustand `persist` middleware
 * in impersonation.store.ts — no manual sessionStorage calls needed here.
 *
 * The router.refresh() call on start/stop is handled by calling sites
 * that need it (e.g., the admin "View As" UI). If you need automatic
 * refresh, call `router.refresh()` after `startImpersonation()` at the call site.
 */

import React from 'react';
import { useImpersonationStore } from '@studio/store';
import { useShallow } from 'zustand/react/shallow';

export type ImpersonationContextType = {
    impersonatedWorkerId: string | null;
    startImpersonation: (workerId: string) => void;
    stopImpersonation: () => void;
};

/**
 * Primary hook — reads impersonation state from the Zustand store.
 */
export function useImpersonation(): ImpersonationContextType {
    return useImpersonationStore(
        useShallow((s) => ({
            impersonatedWorkerId: s.impersonatedWorkerId,
            startImpersonation: s.startImpersonation,
            stopImpersonation: s.stopImpersonation,
        }))
    );
}

/**
 * No-op provider kept for backward compatibility.
 * State lives in Zustand — no React tree wrapping is needed.
 * @deprecated Safe to remove from JSX; it is a transparent passthrough.
 */
export function ImpersonationProvider({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
