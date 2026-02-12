"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';
import { doc } from 'firebase/firestore';
import type { User, Role } from '@/lib/types';
import { useDoc, useUser, useFirestore, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';

type UserRoleContextType = {
  realUserRole: Role | null;
  viewAsRole: Role | null;
  isSuperAdmin: boolean;
  isLoading: boolean;
  setViewAsRole: (role: Role) => void;
  allRoles: Role[]; // This will need to be populated from the DB
  userProfile: User | null;
};

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (user) {
      return doc(firestore, 'users', user.uid);
    }
    return null;
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userProfileRef);

  const roleRef = useMemoFirebase(() => {
    if (userProfile?.roleId) {
      return doc(firestore, 'roles', userProfile.roleId);
    }
    return null;
  }, [firestore, userProfile]);

  const { data: realUserRole, isLoading: isRoleLoading } = useDoc<Role>(roleRef);

  const isSuperAdmin = realUserRole?.id === 'admin';

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

  const isLoading = isUserLoading || isProfileLoading || isRoleLoading;

  const value = {
    realUserRole: realUserRole || null,
    viewAsRole: viewAsRole || null,
    isSuperAdmin,
    isLoading,
    setViewAsRole,
    allRoles: [], // This would need to be fetched if required for a dropdown
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
