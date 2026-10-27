'use client';

import { ReactNode, useEffect } from "react";
import { SupabaseProvider, useSupabase } from "@studio/database";
import { UserRoleSyncerSQL } from "@/store/user-role-syncer-sql";
import { useAuthStore } from "@studio/store";
import { WebIdleTimeout } from "@/components/auth/web-idle-timeout";
import { RealtimeRequestsSync } from "@/components/realtime/realtime-requests-sync";

// Bridge Supabase auth state into the Zustand auth store.
// Normalizes Supabase User (id) → uid so existing code using user?.uid keeps working.
function SupabaseAuthBridge() {
    const { user, isLoading } = useSupabase();

    useEffect(() => {
        const normalized = user ? { ...user, uid: user.id } : null;
        useAuthStore.getState()._setAuthState(normalized, isLoading, null);
    }, [user, isLoading]);

    return null;
}

export function AuthSync({ children }: { children: ReactNode }) {
    return (
        <SupabaseProvider>
            <SupabaseAuthBridge />
            <UserRoleSyncerSQL />
            <WebIdleTimeout />
            <RealtimeRequestsSync />
            {children}
        </SupabaseProvider>
    );
}
