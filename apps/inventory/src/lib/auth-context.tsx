'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

interface WorkerProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    majorMinistryId: string;
    minorMinistryId: string;
    ministryName?: string;
    canManage: boolean; // has inventory:manage permission
}

interface AuthContextType {
    user: User | null;
    profile: WorkerProfile | null;
    ministryId: string | null; // scoping key for all inventory queries
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<WorkerProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadProfile = async (userId: string) => {
        // Look up worker by Supabase auth UID
        const { data: worker } = await supabase
            .from('Worker')
            .select(`
                id, firstName, lastName, email, majorMinistryId, minorMinistryId,
                roles:WorkerRole(
                    role:Role(
                        rolePermissions:RolePermission(
                            permission:Permission(module, action)
                        )
                    )
                )
            `)
            .eq('id', userId)
            .single();

        if (!worker) return null;

        // Check if worker has inventory:manage permission
        const allPerms: string[] = [];
        for (const wr of (worker.roles as any[]) ?? []) {
            for (const rp of wr.role?.rolePermissions ?? []) {
                allPerms.push(`${rp.permission.module}:${rp.permission.action}`);
            }
        }
        const canManage = allPerms.includes('inventory:manage');

        // Get ministry name
        let ministryName: string | undefined;
        if (worker.majorMinistryId) {
            const { data: ministry } = await supabase
                .from('Ministry')
                .select('name')
                .eq('id', worker.majorMinistryId)
                .single();
            ministryName = ministry?.name?.replace(/^[A-Z]-/i, '');
        }

        return {
            id: worker.id,
            firstName: worker.firstName,
            lastName: worker.lastName,
            email: worker.email,
            majorMinistryId: worker.majorMinistryId,
            minorMinistryId: worker.minorMinistryId,
            ministryName,
            canManage,
        } as WorkerProfile;
    };

    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                const p = await loadProfile(session.user.id);
                setProfile(p);
            }
            setIsLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                const p = await loadProfile(session.user.id);
                setProfile(p);
            } else {
                setProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };
        return { error: null };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
    };

    const ministryId = profile?.majorMinistryId ?? null;

    return (
        <AuthContext.Provider value={{ user, profile, ministryId, isLoading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
