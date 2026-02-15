'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type ImpersonationContextType = {
    impersonatedWorkerId: string | null;
    startImpersonation: (workerId: string) => void;
    stopImpersonation: () => void;
};

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'impersonatedWorkerId';

export function ImpersonationProvider({ children }: { children: React.ReactNode }) {
    const [impersonatedWorkerId, setImpersonatedWorkerId] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const storedId = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (storedId) {
            setImpersonatedWorkerId(storedId);
        }
    }, []);

    const startImpersonation = useCallback((workerId: string) => {
        sessionStorage.setItem(SESSION_STORAGE_KEY, workerId);
        setImpersonatedWorkerId(workerId);
        router.refresh();
    }, [router]);

    const stopImpersonation = useCallback(() => {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        setImpersonatedWorkerId(null);
        router.refresh();
    }, [router]);

    const value = { impersonatedWorkerId, startImpersonation, stopImpersonation };

    return (
        <ImpersonationContext.Provider value={value}>
            {children}
        </ImpersonationContext.Provider>
    );
}

export function useImpersonation() {
    const context = useContext(ImpersonationContext);
    if (context === undefined) {
        throw new Error('useImpersonation must be used within an ImpersonationProvider');
    }
    return context;
}
