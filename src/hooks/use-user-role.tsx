"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';
import { doc } from 'firebase/firestore';
import type { Worker, WorkerRole } from '@/lib/types';
import { allRoles } from '@/components/layout/nav';
import { useDoc, useUser, useFirestore, useMemoFirebase } from '@/firebase';

type UserRoleContextType = {
  realUserRole: WorkerRole | null;
  viewAsRole: WorkerRole;
  isSuperAdmin: boolean;
  isLoading: boolean;
  setViewAsRole: (role: WorkerRole) => void;
  allRoles: WorkerRole[];
};

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (user) {
      return doc(firestore, 'worker_profiles', user.uid);
    }
    return null;
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<Worker>(userProfileRef);

  const realUserRole = userProfile?.role || null;
  const isSuperAdmin = realUserRole === 'Super Admin';

  // The role displayed in the UI. Defaults to the user's real role.
  const [viewAsRole, setViewAsRoleState] = useState<WorkerRole>('Volunteer');

  useEffect(() => {
    // When the real role is loaded, set the viewAsRole to it.
    if (realUserRole) {
      setViewAsRoleState(realUserRole);
    }
  }, [realUserRole]);

  const setViewAsRole = (role: WorkerRole) => {
    if (isSuperAdmin) {
        setViewAsRoleState(role);
    }
  };

  const isLoading = isUserLoading || isProfileLoading;

  const value = {
    realUserRole,
    viewAsRole,
    isSuperAdmin,
    isLoading,
    setViewAsRole,
    allRoles,
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
