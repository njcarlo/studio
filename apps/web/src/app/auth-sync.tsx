'use client';

import { useAuthStore } from "@studio/store";
import { FirebaseClientProvider } from "@studio/database";
import { UserRoleSyncer } from "@studio/store";
import { ReactNode } from "react";

export function AuthSync({ children }: { children: ReactNode }) {
    const _setAuthState = useAuthStore((s) => s._setAuthState);

    return (
        <FirebaseClientProvider onAuthChange={_setAuthState}>
            <UserRoleSyncer />
            {children}
        </FirebaseClientProvider>
    );
}
