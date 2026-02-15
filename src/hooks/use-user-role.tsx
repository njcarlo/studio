"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';
import { doc, collection } from 'firebase/firestore';
import type { Worker, Role } from '@/lib/types';
import { useDoc, useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { useImpersonation } from '@/hooks/use-impersonation';

type UserRoleContextType = {
  realUserRole: Role | null;
  isSuperAdmin: boolean;
  needsSeeding: boolean;
  isLoading: boolean;
  allRoles: Role[];
  workerProfile: Worker | null;
};

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { impersonatedWorkerId } = useImpersonation();
  
  // --- Real User Data (for checking admin status) ---
  const realWorkerProfileRef = useMemoFirebase(() => user ? doc(firestore, 'workers', user.uid) : null, [firestore, user]);
  const { data: realWorkerProfile, isLoading: isRealProfileLoading } = useDoc<Worker>(realWorkerProfileRef);
  
  const realRoleRef = useMemoFirebase(() => realWorkerProfile?.roleId ? doc(firestore, 'roles', realWorkerProfile.roleId) : null, [firestore, realWorkerProfile]);
  const { data: realUserRole, isLoading: isRealRoleLoading } = useDoc<Role>(realRoleRef);
  
  const isSuperAdmin = user?.email === 'admin@system.com' || realWorkerProfile?.roleId === 'admin';

  // --- "View As" User Data ---
  const viewAsWorkerId = isSuperAdmin ? impersonatedWorkerId : null; // Only allow admins to impersonate
  const idToFetch = viewAsWorkerId || user?.uid;

  const workerProfileRef = useMemoFirebase(() => {
    return idToFetch ? doc(firestore, 'workers', idToFetch) : null;
  }, [firestore, idToFetch]);
  const { data: workerProfile, isLoading: isProfileLoading } = useDoc<Worker>(workerProfileRef);

  // Check if the admin role exists to determine if seeding is needed.
  const adminRoleRef = useMemoFirebase(() => {
      return doc(firestore, 'roles', 'admin');
  }, [firestore]);
  const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc<Role>(adminRoleRef);
  const needsSeeding = !adminRole && !isAdminRoleLoading;

  // Fetch all roles for dropdowns etc.
  const rolesRef = useMemoFirebase(() => {
    if (!user) return null; // Wait for user to be authenticated
    return collection(firestore, 'roles');
  }, [firestore, user]);
  const { data: allRoles, isLoading: areAllRolesLoading } = useCollection<Role>(rolesRef);

  const isLoading = isUserLoading || isRealProfileLoading || isProfileLoading || areAllRolesLoading || isAdminRoleLoading;

  const value = {
    realUserRole: realUserRole || null,
    isSuperAdmin,
    needsSeeding,
    isLoading,
    allRoles: allRoles || [],
    workerProfile: workerProfile || null,
  };

  return (
    <UserRoleContext.Provider value={value}>
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (context === undefined) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
}
