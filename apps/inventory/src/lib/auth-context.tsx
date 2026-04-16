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
    canManage: boolean;   // has inventory:manage
    canAccess: boolean;   // has inventory:access (read-only)
    isSuperAdmin: boolean;
}

interface AuthContextType {
    user: User | null;
    profile: WorkerProfile | null;
    ministryId: string | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Aggregate all module:action permission strings from a worker's roles.
 * Mirrors the logic in apps/web/src/store/user-role-syncer-sql.tsx.
 * Handles multiple roles with overlapping permissions — uses a Set to dedupe.
 */
function aggregatePermissions(worker: any): Set<string> {
    const perms = new Set<string>();
    if (!worker) return perms;

    // Primary: WorkerRole join table (new RBAC) — worker may have MANY roles
    if (worker.roles && worker.roles.length > 0) {
        for (const wr of worker.roles) {
            // Each role may have many rolePermissions
            if (wr.role?.rolePermissions) {
                for (const rp of wr.role.rolePermissions) {
                    if (rp.permission) {
                        perms.add(`${rp.permission.module}:${rp.permission.action}`);
                    }
                }
            }
            // isSuperAdmin flag on any role grants everything
            if (wr.role?.isSuperAdmin) {
                perms.add('__superadmin__');
            }
        }
    }

    // Fallback: legacy Role.permissions string[] (old flat strings)
    if (worker.role?.permissions) {
        for (const p of worker.role.permissions) {
            perms.add(p);
        }
    }
    if (worker.role?.isSuperAdmin) {
        perms.add('__superadmin__');
    }
    // Legacy: roleId === 'admin' is super admin
    if (worker.role?.id === 'admin' || worker.roleId === 'admin') {
        perms.add('__superadmin__');
    }

    return perms;
}

async function loadWorkerProfile(userId: string, userEmail?: string): Promise<WorkerProfile | null> {
    // Try by Supabase auth UID first, then fall back to email
    // The Worker.id in Prisma is a UUID that matches the Supabase auth user id
    // when the worker was created via Supabase Auth.
    let worker: any = null;

    const { data: byId } = await supabase
        .from('Worker')
        .select(`
            id, firstName, lastName, email, majorMinistryId, minorMinistryId, roleId,
            role:Role(id, name, isSuperAdmin, permissions),
            roles:WorkerRole(
                role:Role(
                    id, name, isSuperAdmin, permissions,
                    rolePermissions:RolePermission(
                        permission:Permission(module, action)
                    )
                )
            )
        `)
        .eq('id', userId)
        .maybeSingle();

    worker = byId;

    // Fallback: look up by email if UID didn't match
    if (!worker && userEmail) {
        const { data: byEmail } = await supabase
            .from('Worker')
            .select(`
                id, firstName, lastName, email, majorMinistryId, minorMinistryId, roleId,
                role:Role(id, name, isSuperAdmin, permissions),
                roles:WorkerRole(
                    role:Role(
                        id, name, isSuperAdmin, permissions,
                        rolePermissions:RolePermission(
                            permission:Permission(module, action)
                        )
                    )
                )
            `)
            .eq('email', userEmail)
            .maybeSingle();
        worker = byEmail;
    }

    if (!worker) return null;

    // Aggregate all permissions across all roles (union, deduped)
    const perms = aggregatePermissions(worker);
    const isSuperAdmin = perms.has('__superadmin__');

    const canManage = isSuperAdmin || perms.has('inventory:manage');
    const canAccess = isSuperAdmin || canManage || perms.has('inventory:access');

    // Get ministry name
    let ministryName: string | undefined;
    if (worker.majorMinistryId) {
        const { data: ministry } = await supabase
            .from('Ministry')
            .select('name')
            .eq('id', worker.majorMinistryId)
            .maybeSingle();
        ministryName = ministry?.name?.replace(/^[A-Z]-/i, '');
    }

    return {
        id: worker.id,
        firstName: worker.firstName,
        lastName: worker.lastName,
        email: worker.email,
        majorMinistryId: worker.majorMinistryId ?? '',
        minorMinistryId: worker.minorMinistryId ?? '',
        ministryName,
        canManage,
        canAccess,
        isSuperAdmin,
    };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<WorkerProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                const p = await loadWorkerProfile(session.user.id, session.user.email ?? undefined);
                setProfile(p);
            }
            setIsLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                const p = await loadWorkerProfile(session.user.id, session.user.email ?? undefined);
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

    // Super admins see all inventory (no ministry filter)
    const ministryId = profile?.isSuperAdmin ? null : (profile?.majorMinistryId ?? null);

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
