'use client';

import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';

/**
 * Auth store — holds the authenticated Supabase user and loading state.
 * Populated by SupabaseAuthBridge via `_setAuthState` in auth-sync.tsx.
 */
export interface AuthState {
    user: any | null;
    isUserLoading: boolean;
    userError: Error | null;

    _setAuthState: (user: any | null, isLoading: boolean, error: Error | null) => void;
}

export const useAuthStore = create<AuthState>()(
    devtools(
        persist(
            (set) => ({
                user: null,
                isUserLoading: true,
                userError: null,

                _setAuthState: (user, isUserLoading, userError) =>
                    set({ user, isUserLoading, userError }, false, 'auth/_setAuthState'),
            }),
            {
                name: 'cog_auth_user',
                storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : ({} as any))),
                partialize: (state) => ({ user: state.user }),
            }
        ),
        { name: 'AuthStore' }
    )
);
