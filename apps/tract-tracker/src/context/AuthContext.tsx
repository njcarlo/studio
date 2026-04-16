import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseAdmin } from '../supabase';

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
    session: any | null;
    user: any | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signUp: (email: string, password: string, metadata: Partial<AuthState>) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
}

// In dev builds (__DEV__ = true), signIn/signUp bypass Supabase so the
// frontend dev can work on all screens without needing credentials or network.
// The auth screens still render normally for UI editing.
const DEV_USER = {
    id: 'dev',
    name: 'Dev Admin',
    email: 'dev@local',
    region: 'MMR',
    sub_region: 'Dasmarinas',
    barangay: 'Burol I',
    tracts_given: 0,
    is_tester: true,
    is_admin: true,
};

const initialState: AuthState = { region: '', subRegion: '', barangay: '', name: '' };
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [authState, setAuthStateInternal] = useState<AuthState>(initialState);
    const [user, setUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (__DEV__) {
            setIsLoading(false);
            return;
        }

        const loadSession = async () => {
            try {
                const storedUserId = await AsyncStorage.getItem('tract_user_id');
                if (storedUserId) {
                    const { data, error } = await supabaseAdmin
                        .from('tract_users')
                        .select('*')
                        .eq('id', storedUserId)
                        .single();

                    if (data && !error) {
                        setUser(data);
                        setAuthStateInternal({
                            region: data.region || '',
                            subRegion: data.sub_region || '',
                            barangay: data.barangay || '',
                            name: data.name || '',
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
        if (__DEV__) {
            setUser(DEV_USER);
            setAuthStateInternal({
                region: 'COG Dasmarinas',
                subRegion: 'Dasmarinas',
                barangay: 'Burol I',
                name: 'Dev Admin',
            });
            return { error: null };
        }
        const { data, error } = await supabaseAdmin
            .from('tract_users')
            .select('*')
            .eq('email', email)
            .eq('password', password)
            .single();

        if (error || !data) return { error: 'Invalid email or password.' };

        await AsyncStorage.setItem('tract_user_id', data.id);
        setUser(data);
        setAuthStateInternal({
            region: data.region || '',
            subRegion: data.sub_region || '',
            barangay: data.barangay || '',
            name: data.name || '',
        });
        return { error: null };
    };

    const signUp = async (email: string, password: string, metadata: Partial<AuthState>) => {
        if (__DEV__) {
            setUser({ ...DEV_USER, email, name: metadata.name || 'Dev User' });
            setAuthStateInternal({
                region: metadata.region || 'COG Dasmarinas',
                subRegion: metadata.subRegion || 'Dasmarinas',
                barangay: metadata.barangay || 'Burol I',
                name: metadata.name || 'Dev User',
            });
            return { error: null };
        }
        const { data: existing } = await supabaseAdmin
            .from('tract_users')
            .select('id')
            .eq('email', email)
            .single();

        if (existing) return { error: 'Email already registered.' };

        const { data, error } = await supabaseAdmin.from('tract_users').insert({
            email,
            password,
            name: metadata.name || email.split('@')[0],
            region: metadata.region || '',
            sub_region: metadata.subRegion || '',
            barangay: metadata.barangay,
            tracts_given: 0,
            is_tester: false,
            is_admin: false,
        }).select().single();

        if (error || !data) return { error: error?.message || 'Failed to create account.' };

        await AsyncStorage.setItem('tract_user_id', data.id);
        setUser(data);
        setAuthStateInternal({
            region: data.region || '',
            subRegion: data.sub_region || '',
            barangay: data.barangay || '',
            name: data.name || '',
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

// Emails that always bypass the countdown (testers/admins)
const TESTER_EMAILS = new Set(['njcarlo@gmail.com', 'pacleb@gmail.com']);

    const isTester = user?.is_tester === true || TESTER_EMAILS.has(user?.email?.toLowerCase() ?? '');
    const isAdmin = user?.is_admin === true || TESTER_EMAILS.has(user?.email?.toLowerCase() ?? '');
    const session = user ? { user } : null;

    return (
        <AuthContext.Provider value={{
            authState, setAuthState, isDasmarinas, isTester, isAdmin,
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
