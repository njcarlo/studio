'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Auth store — holds the authenticated user and loading state.
 * Populated by FirebaseClientProvider via `_setAuthState` in auth-sync.tsx.
 * Uses `any` for User type to stay compatible with Firebase User shape.
 */
export interface AuthState {
    user: any | null;
    isUserLoading: boolean;
    userError: Error | null;

    _setAuthState: (user: any | null, isLoading: boolean, error: Error | null) => void;
}

export const useAuthStore = create<AuthState>()(
    devtools(
        (set) => ({
            user: null,
            isUserLoading: true,
            userError: null,

            _setAuthState: (user, isUserLoading, userError) =>
                set({ user, isUserLoading, userError }, false, 'auth/_setAuthState'),
        }),
        { name: 'AuthStore' }
    )
);
