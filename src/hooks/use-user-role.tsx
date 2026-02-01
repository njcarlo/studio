"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';
import type { WorkerRole } from '@/lib/types';
import { allRoles } from '@/components/layout/nav';

// Mock current user. This should be replaced with real auth logic.
const realUser: { role: WorkerRole } = {
  role: 'Super Admin',
};

type UserRoleContextType = {
  realUserRole: WorkerRole;
  viewAsRole: WorkerRole;
  isSuperAdmin: boolean;
  setViewAsRole: (role: WorkerRole) => void;
  allRoles: WorkerRole[];
};

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const [viewAsRole, setViewAsRoleState] = useState<WorkerRole>(realUser.role);
  const isSuperAdmin = realUser.role === 'Super Admin';

  useEffect(() => {
    if (!isSuperAdmin) {
        setViewAsRoleState(realUser.role);
    }
  }, [isSuperAdmin]);


  const setViewAsRole = (role: WorkerRole) => {
    if (isSuperAdmin) {
        setViewAsRoleState(role);
    }
  };

  const value = {
    realUserRole: realUser.role,
    viewAsRole,
    isSuperAdmin,
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
