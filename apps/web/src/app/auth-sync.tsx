'use client';

import { ReactNode, useEffect } from "react";
import { FirebaseAuthProvider, useFirebaseAuth } from "@/lib/firebase-provider";
import { UserRoleSyncerSQL } from "@/store/user-role-syncer-sql";
import { useAuthStore } from "@studio/store";

// Bridge Firebase auth state into the Zustand auth store. Firebase's User
// already exposes `.uid`/`.email` natively (unlike Supabase's, which used
// `.id`), so no normalization is needed for existing code reading `user?.uid`.
function FirebaseAuthBridge() {
    const { user, isLoading } = useFirebaseAuth();

    useEffect(() => {
        useAuthStore.getState()._setAuthState(user, isLoading, null);
    }, [user, isLoading]);

    return null;
}

export function AuthSync({ children }: { children: ReactNode }) {
    return (
        <FirebaseAuthProvider>
            <FirebaseAuthBridge />
            <UserRoleSyncerSQL />
            {children}
        </FirebaseAuthProvider>
    );
}
