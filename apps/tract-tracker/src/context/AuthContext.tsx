import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabase';

interface AuthState {
    region: string;
    subRegion: string;
    barangay: string;
}

interface AuthContextType {
    authState: AuthState;
    setAuthState: (state: Partial<AuthState>) => void;
    isDasmarinas: boolean;
    session: Session | null;
    user: User | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signUp: (email: string, password: string, metadata: Partial<AuthState>) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
}

const initialState: AuthState = { region: '', subRegion: '', barangay: '' };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [authState, setAuthStateInternal] = useState<AuthState>(initialState);
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user?.user_metadata) {
                const meta = session.user.user_metadata;
                setAuthStateInternal({
                    region: meta.region || '',
                    subRegion: meta.subRegion || '',
                    barangay: meta.barangay || '',
                });
            }
            setIsLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user?.user_metadata) {
                const meta = session.user.user_metadata;
                setAuthStateInternal({
                    region: meta.region || '',
                    subRegion: meta.subRegion || '',
                    barangay: meta.barangay || '',
                });
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const setAuthState = (newState: Partial<AuthState>) => {
        setAuthStateInternal(prev => ({ ...prev, ...newState }));
    };

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
    };

    const signUp = async (email: string, password: string, metadata: Partial<AuthState>) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: metadata },
        });
        return { error: error?.message ?? null };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setAuthStateInternal(initialState);
    };

    const isDasmarinas =
        authState.subRegion.toLowerCase() === 'dasmarinas' ||
        authState.subRegion.toLowerCase() === 'dasmariñas';

    return (
        <AuthContext.Provider value={{ authState, setAuthState, isDasmarinas, session, user, isLoading, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
