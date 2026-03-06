'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User } from 'firebase/auth';

/**
 * Auth store — holds the authenticated Firebase user and loading state.
 * Populated by the FirebaseProvider via `syncAuthToStore`.
 *
 * This is the single source of truth for auth state across the app,
 * replacing fragmented `useUser()` / `useContext(FirebaseContext)` calls.
 */
export interface AuthState {
    user: User | null;
    isUserLoading: boolean;
    userError: Error | null;

    // Actions
    _setAuthState: (user: User | null, isLoading: boolean, error: Error | null) => void;
}

export const useAuthStore = create<AuthState>()(
    devtools(
        (set) => ({
            user: null,
            isUserLoading: true, // starts true — we don't know yet
            userError: null,

            _setAuthState: (user, isUserLoading, userError) =>
                set({ user, isUserLoading, userError }, false, 'auth/_setAuthState'),
        }),
        { name: 'AuthStore' }
    )
);
