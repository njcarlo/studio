import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { callApi } from '../supabase';

export interface AuthState {
    region: string;
    subRegion: string;
    barangay: string;
    name: string;
}

interface AuthContextType {
    authState: AuthState;
    setAuthState: (state: Partial<AuthState>) => void;
    isDasmarinas: boolean;
    isTester: boolean;
    isAdmin: boolean;
    isCorrespondent: boolean;
    session: any | null;
    user: any | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signUp: (email: string, password: string, metadata: Partial<AuthState>) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
}

// Emails that always bypass the countdown (testers/admins)
const TESTER_EMAILS = new Set(['njcarlo@gmail.com', 'pacleb@gmail.com', 'pardopreciousjohn@gmail.com', 'cogtv@gmail.com']);
const ADMIN_EMAILS  = new Set(['njcarlo@gmail.com', 'cogtv@gmail.com']);

const initialState: AuthState = { region: '', subRegion: '', barangay: '', name: '' };
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [authState, setAuthStateInternal] = useState<AuthState>(initialState);
    const [user, setUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadSession = async () => {
            try {
                const storedUserId = await AsyncStorage.getItem('tract_user_id');
                if (storedUserId) {
                    const { data, error } = await callApi<{ user: any }>('auth-api', { action: 'session', userId: storedUserId });

                    if (data?.user && !error) {
                        setUser(data.user);
                        setAuthStateInternal({
                            region: data.user.region || '',
                            subRegion: data.user.sub_region || '',
                            barangay: data.user.barangay || '',
                            name: data.user.name || '',
                        });
                    } else {
                        await AsyncStorage.removeItem('tract_user_id');
                    }
                }
            } catch (e) {
                console.error('Failed to load session', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadSession();
    }, []);

    const setAuthState = (newState: Partial<AuthState>) => {
        setAuthStateInternal(prev => ({ ...prev, ...newState }));
    };

    const signIn = async (email: string, password: string) => {
        if (!email || !password) return { error: 'Please enter your email and password.' };

        const { data, error } = await callApi<{ user: any }>('auth-api', { action: 'signin', email, password });
        if (error || !data?.user) return { error: error?.message || 'Invalid email or password.' };

        await AsyncStorage.setItem('tract_user_id', data.user.id);
        setUser(data.user);
        setAuthStateInternal({
            region: data.user.region || '',
            subRegion: data.user.sub_region || '',
            barangay: data.user.barangay || '',
            name: data.user.name || '',
        });
        return { error: null };
    };

    const signUp = async (email: string, password: string, metadata: Partial<AuthState>) => {
        if (!email || !password) return { error: 'Please enter your email and password.' };

        const { data, error } = await callApi<{ user: any }>('auth-api', {
            action: 'signup',
            email,
            password,
            name: metadata.name,
            region: metadata.region,
            subRegion: metadata.subRegion,
            barangay: metadata.barangay,
        });
        if (error || !data?.user) return { error: error?.message || 'Failed to create account.' };

        await AsyncStorage.setItem('tract_user_id', data.user.id);
        setUser(data.user);
        setAuthStateInternal({
            region: data.user.region || '',
            subRegion: data.user.sub_region || '',
            barangay: data.user.barangay || '',
            name: data.user.name || '',
        });
        return { error: null };
    };

    const signOut = async () => {
        await AsyncStorage.removeItem('tract_user_id');
        setUser(null);
        setAuthStateInternal(initialState);
    };

    const isDasmarinas =
        authState.region === 'COG Dasmarinas' ||
        authState.subRegion.toLowerCase() === 'dasmarinas' ||
        authState.subRegion.toLowerCase() === 'dasmariñas';

    const isTester = user?.is_tester === true || TESTER_EMAILS.has(user?.email?.toLowerCase() ?? '');
    const isAdmin = user?.is_admin === true || ADMIN_EMAILS.has(user?.email?.toLowerCase() ?? '');
    const isCorrespondent = user?.is_correspondent === true || isAdmin;
    const session = user ? { user } : null;

    return (
        <AuthContext.Provider value={{
            authState, setAuthState, isDasmarinas, isTester, isAdmin, isCorrespondent,
            session, user, isLoading, signIn, signUp, signOut,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
