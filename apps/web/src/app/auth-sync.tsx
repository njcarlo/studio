'use client';

import { useAuthStore } from "@studio/store";
import { FirebaseClientProvider, SupabaseProvider } from "@studio/database";
import { UserRoleSyncerSQL } from "@/store/user-role-syncer-sql";
import { ReactNode } from "react";

export function AuthSync({ children }: { children: ReactNode }) {
    const _setAuthState = useAuthStore((s) => s._setAuthState);

    return (
        <SupabaseProvider>
            <FirebaseClientProvider onAuthChange={_setAuthState}>
                <UserRoleSyncerSQL />
                {children}
            </FirebaseClientProvider>
        </SupabaseProvider>
    );
}
