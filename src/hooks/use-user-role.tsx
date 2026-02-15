"use client";

import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { doc, collection } from 'firebase/firestore';
import type { Worker, Role } from '@/lib/types';
import { useDoc, useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { useImpersonation } from '@/hooks/use-impersonation';

type UserRoleContextType = {
  isSuperAdmin: boolean;
  needsSeeding: boolean;
  isLoading: boolean;
  allRoles: Role[];
  workerProfile: Worker | null;
  canManageWorkers: boolean;
  canManageRoles: boolean;
  canManageMinistries: boolean;
  canManageRooms: boolean;
  canManageApprovals: boolean;
  canOperateScanner: boolean;
  canManageMealStubs: boolean;
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

  const viewAsRoleRef = useMemoFirebase(() => workerProfile?.roleId ? doc(firestore, 'roles', workerProfile.roleId) : null, [firestore, workerProfile]);
  const { data: viewAsUserRole, isLoading: isViewAsRoleLoading } = useDoc<Role>(viewAsRoleRef);

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

  const isLoading = isUserLoading || isRealProfileLoading || isProfileLoading || areAllRolesLoading || isAdminRoleLoading || isRealRoleLoading || isViewAsRoleLoading;

  const value = useMemo(() => {
    // For permission checks, we always use the REAL user's role, not the impersonated one.
    // Impersonation is for viewing content, not for performing actions.
    const permissions = realUserRole?.permissions || [];
    return {
      isSuperAdmin,
      needsSeeding,
      isLoading,
      allRoles: allRoles || [],
      workerProfile: workerProfile || null,
      canManageWorkers: isSuperAdmin || permissions.includes('manage_workers'),
      canManageRoles: isSuperAdmin || permissions.includes('manage_roles'),
      canManageMinistries: isSuperAdmin || permissions.includes('manage_ministries'),
      canManageRooms: isSuperAdmin || permissions.includes('manage_rooms'),
      canManageApprovals: isSuperAdmin || permissions.includes('manage_approvals'),
      canOperateScanner: isSuperAdmin || permissions.includes('operate_scanner'),
      canManageMealStubs: isSuperAdmin || permissions.includes('manage_meal_stubs'),
    };
  }, [isSuperAdmin, needsSeeding, isLoading, allRoles, workerProfile, realUserRole]);

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
