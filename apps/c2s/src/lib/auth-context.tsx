'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from './auth';

const SESSION_KEY = 'c2s_user';

interface AuthContextType {
    user: User | null;
    login: (user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: () => {},
    logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    // Restore session on mount — use localStorage so it persists across refreshes
    useEffect(() => {
        const stored = localStorage.getItem(SESSION_KEY);
        if (stored) {
            try { setUser(JSON.parse(stored)); } catch {}
        }
    }, []);

    function login(u: User) {
        setUser(u);
        localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    }

    function logout() {
        setUser(null);
        localStorage.removeItem(SESSION_KEY);
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
