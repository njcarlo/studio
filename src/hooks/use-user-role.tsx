"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';
import { doc } from 'firebase/firestore';
import type { Worker, WorkerRole } from '@/lib/types';
import { allRoles } from '@/components/layout/nav';
import { useDoc, useUser, useFirestore, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';

type UserRoleContextType = {
  realUserRole: WorkerRole | null;
  viewAsRole: WorkerRole;
  isSuperAdmin: boolean;
  isLoading: boolean;
  setViewAsRole: (role: WorkerRole) => void;
  allRoles: WorkerRole[];
  userProfile: Worker | null;
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

  useEffect(() => {
    // If auth is loaded, a user is present, but their profile is not yet loading and does not exist,
    // it means they are a new user. We'll create a default profile for them.
    if (!isUserLoading && user && !isProfileLoading && !userProfile) {
      const isSuperAdminEmail = user.email === 'njcarlo@gmail.com';
      const nameParts = user.displayName?.split(' ') || [];
      const firstName = nameParts[0] || 'New';
      const lastName = nameParts.slice(1).join(' ') || 'Worker';

      const newProfile: Partial<Worker> = {
        firstName,
        lastName,
        email: user.email!,
        avatarUrl: user.photoURL || `https://picsum.photos/seed/${user.uid.slice(0,5)}/100/100`,
        role: isSuperAdminEmail ? 'Super Admin' : 'Mentee',
        status: isSuperAdminEmail ? 'Active' : 'Pending Approval',
        permissions: [],
        phone: user.phoneNumber || ''
      };

      const workerRef = doc(firestore, 'worker_profiles', user.uid);
      setDocumentNonBlocking(workerRef, newProfile, {}); // Non-blocking create
    }
  }, [user, isUserLoading, userProfile, isProfileLoading, firestore]);

  // Determine the user's role, with a special override for the Super Admin email.
  const databaseRole = userProfile?.role || null;
  const isHardcodedSuperAdmin = user?.email === 'njcarlo@gmail.com';
  
  const realUserRole = isHardcodedSuperAdmin ? 'Super Admin' : databaseRole;
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
    userProfile: userProfile || null,
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
