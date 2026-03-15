'use client';

import { ReactNode } from "react";
import { FirebaseClientProvider } from "@studio/database";
import { UserRoleSyncerSQL } from "@/store/user-role-syncer-sql";
import { useAuthStore } from "@studio/store";
import type { User, AuthError } from "firebase/auth";

function handleAuthChange(user: User | null, isLoading: boolean, error: AuthError | Error | null) {
    // Bridge Firebase auth state into the Zustand auth store
    useAuthStore.getState()._setAuthState(user as any, isLoading, error);
}

export function AuthSync({ children }: { children: ReactNode }) {
    return (
        <FirebaseClientProvider onAuthChange={handleAuthChange}>
            <UserRoleSyncerSQL />
            {children}
        </FirebaseClientProvider>
    );
}
