'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { User } from './session-user';

interface AuthContextType {
    user: User | null;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    logout: async () => {},
});

/**
 * Holds the user resolved on the server for this request. There is no
 * client-side session store — the httpOnly `fb_session` cookie is the session,
 * and the layout re-resolves it server-side on every navigation.
 */
export function AuthProvider({ children, user }: { children: ReactNode; user: User | null }) {
    const [current, setCurrent] = useState<User | null>(user);

    const logout = useCallback(async () => {
        await fetch('/api/auth/session', { method: 'DELETE' });
        setCurrent(null);
        // Full navigation so the server re-resolves the (now absent) session.
        window.location.assign('/login');
    }, []);

    return (
        <AuthContext.Provider value={{ user: current, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
