"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';
import { doc, collection } from 'firebase/firestore';
import type { Worker, Role } from '@/lib/types';
import { useDoc, useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';

type UserRoleContextType = {
  realUserRole: Role | null;
  viewAsRole: Role | null;
  isSuperAdmin: boolean;
  needsSeeding: boolean;
  isLoading: boolean;
  setViewAsRole: (role: Role) => void;
  allRoles: Role[];
  workerProfile: Worker | null;
};

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Check if the admin role exists to determine if seeding is needed.
  const adminRoleRef = useMemoFirebase(() => {
      // We check this even if user is not loaded, to handle initial state
      return doc(firestore, 'roles', 'admin');
  }, [firestore]);
  const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc<Role>(adminRoleRef);

  const workerProfileRef = useMemoFirebase(() => {
    if (user) {
      return doc(firestore, 'workers', user.uid);
    }
    return null;
  }, [firestore, user]);

  const { data: workerProfile, isLoading: isProfileLoading } = useDoc<Worker>(workerProfileRef);

  const roleRef = useMemoFirebase(() => {
    if (workerProfile?.roleId) {
      return doc(firestore, 'roles', workerProfile.roleId);
    }
    return null;
  }, [firestore, workerProfile]);

  const { data: realUserRole, isLoading: isRoleLoading } = useDoc<Role>(roleRef);
  
  const rolesRef = useMemoFirebase(() => {
    if (!user) return null; // Wait for user to be authenticated
    return collection(firestore, 'roles');
  }, [firestore, user]);
  const { data: allRoles, isLoading: areAllRolesLoading } = useCollection<Role>(rolesRef);

  const isSuperAdmin = realUserRole?.id === 'admin';
  const needsSeeding = !adminRole && !isAdminRoleLoading;

  // The role displayed in the UI. Defaults to the user's real role.
  const [viewAsRole, setViewAsRoleState] = useState<Role | null>(null);

  useEffect(() => {
    // When the real role is loaded, set the viewAsRole to it.
    if (realUserRole) {
      setViewAsRoleState(realUserRole);
    }
  }, [realUserRole]);

  const setViewAsRole = (role: Role) => {
    if (isSuperAdmin) {
        setViewAsRoleState(role);
    }
  };

  const isLoading = isUserLoading || isProfileLoading || isRoleLoading || areAllRolesLoading || isAdminRoleLoading;

  const value = {
    realUserRole: realUserRole || null,
    viewAsRole: viewAsRole || null,
    isSuperAdmin,
    needsSeeding,
    isLoading,
    setViewAsRole,
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
