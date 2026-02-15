"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';
import { doc, collection } from 'firebase/firestore';
import type { Worker, Role } from '@/lib/types';
import { useDoc, useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { getIdTokenResult } from 'firebase/auth';

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
  
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isClaimLoading, setIsClaimLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setIsClaimLoading(true);
      // Force refresh the token to get the latest custom claims.
      getIdTokenResult(user, true)
        .then((idTokenResult) => {
          const isAdmin = idTokenResult.claims.admin === true;
          setIsSuperAdmin(isAdmin);
        })
        .catch(() => setIsSuperAdmin(false))
        .finally(() => setIsClaimLoading(false));
    } else {
      setIsSuperAdmin(false);
      setIsClaimLoading(false);
    }
  }, [user]);

  // Check if the admin role exists to determine if seeding is needed.
  const adminRoleRef = useMemoFirebase(() => {
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

  const needsSeeding = !adminRole && !isAdminRoleLoading;

  const isLoading = isUserLoading || isProfileLoading || isRoleLoading || areAllRolesLoading || isAdminRoleLoading || isClaimLoading;

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
