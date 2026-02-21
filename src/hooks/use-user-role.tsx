"use client";

import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { doc, collection, query, where, limit } from 'firebase/firestore';
import type { Worker, Role } from '@/lib/types';
import { useDoc, useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { useImpersonation } from '@/hooks/use-impersonation';

export type UserRoleContextType = {
  isSuperAdmin: boolean;
  needsSeeding: boolean;
  isLoading: boolean;
  allRoles: Role[];
  workerProfile: Worker | null;
  canManageWorkers: boolean;
  canManageRoles: boolean;
  canManageMinistries: boolean;
  canManageFacilities: boolean;
  canCreateRoomReservation: boolean;
  canEditRoomReservation: boolean;
  canDeleteRoomReservation: boolean;
  canApproveRoomReservation: boolean;
  canManageApprovals: boolean;
  canOperateScanner: boolean;
  canViewAttendance: boolean;
  canViewMealStubs: boolean;
  canManageAllMealStubs: boolean;
  canViewReports: boolean;
  canAppointApprovers: boolean;
  canManageC2S: boolean;
  canViewC2SAnalytics: boolean;
  isMealStubAssigner: boolean;
  isMinistryHead: boolean;
};

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { impersonatedWorkerId } = useImpersonation();

  // 1. Fetch real worker profile (by UID)
  const realWorkerProfileRef = useMemoFirebase(() => user ? doc(firestore, 'workers', user.uid) : null, [firestore, user]);
  const { data: rawRealWorkerProfile, isLoading: isRealProfileByIdLoading } = useDoc<Worker>(realWorkerProfileRef);

  // 2. Fallback for real worker profile (by email)
  const realProfileByEmailQuery = useMemoFirebase(() => {
    if (!user?.email || rawRealWorkerProfile || isRealProfileByIdLoading) return null;
    return query(collection(firestore, 'workers'), where('email', '==', user.email), limit(1));
  }, [firestore, user?.email, rawRealWorkerProfile, isRealProfileByIdLoading]);
  const { data: realProfileByEmailData, isLoading: isRealProfileByEmailLoading } = useCollection<Worker>(realProfileByEmailQuery);
  const realProfileByEmail = realProfileByEmailData?.[0] || null;

  const realWorkerProfile = rawRealWorkerProfile || realProfileByEmail;
  const isRealProfileLoading = isRealProfileByIdLoading || (!!user?.email && !rawRealWorkerProfile && isRealProfileByEmailLoading);

  // 3. Admin status and View As logic
  const isSuperAdmin = user?.email === 'admin@system.com' || realWorkerProfile?.roleId === 'admin';
  const viewAsWorkerId = isSuperAdmin ? impersonatedWorkerId : null;
  const idToFetch = viewAsWorkerId || user?.uid;

  // 4. Fetch the "View As" profile (by ID)
  const workerProfileRef = useMemoFirebase(() => {
    return idToFetch ? doc(firestore, 'workers', idToFetch) : null;
  }, [firestore, idToFetch]);
  const { data: rawWorkerProfile, isLoading: isProfileByIdLoading } = useDoc<Worker>(workerProfileRef);

  // 5. Fallback for the "View As" profile (by email) - only if NOT impersonating by ID
  const profileByEmailQuery = useMemoFirebase(() => {
    if (viewAsWorkerId || !user?.email || rawWorkerProfile || isProfileByIdLoading) return null;
    return query(collection(firestore, 'workers'), where('email', '==', user.email), limit(1));
  }, [firestore, user?.email, rawWorkerProfile, isProfileByIdLoading, viewAsWorkerId]);
  const { data: profileByEmailData, isLoading: isProfileByEmailLoading } = useCollection<Worker>(profileByEmailQuery);
  const profileByEmail = profileByEmailData?.[0] || null;

  const workerProfile = rawWorkerProfile || profileByEmail;
  const isProfileLoading = isProfileByIdLoading || (!viewAsWorkerId && !!user?.email && !rawWorkerProfile && isProfileByEmailLoading);

  // 6. Fetch Roles
  const realRoleRef = useMemoFirebase(() => realWorkerProfile?.roleId ? doc(firestore, 'roles', realWorkerProfile.roleId) : null, [firestore, realWorkerProfile?.roleId]);
  const { data: realUserRole, isLoading: isRealRoleLoading } = useDoc<Role>(realRoleRef);

  const viewAsRoleRef = useMemoFirebase(() => workerProfile?.roleId ? doc(firestore, 'roles', workerProfile.roleId) : null, [firestore, workerProfile?.roleId]);
  const { data: viewAsUserRole, isLoading: isViewAsRoleLoading } = useDoc<Role>(viewAsRoleRef);

  const adminRoleRef = useMemoFirebase(() => user ? doc(firestore, 'roles', 'admin') : null, [firestore, user]);
  const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc<Role>(adminRoleRef);
  const needsSeeding = !!user && !isAdminRoleLoading && !adminRole;

  const rolesRef = useMemoFirebase(() => user ? collection(firestore, 'roles') : null, [firestore, user]);
  const { data: allRoles, isLoading: areRolesLoading } = useCollection<Role>(rolesRef);

  // 7. Fetch Ministries
  const ministriesRef = useMemoFirebase(() => user ? collection(firestore, 'ministries') : null, [firestore, user]);
  const { data: allMinistries, isLoading: areMinistriesLoading } = useCollection<any>(ministriesRef);

  const isMealStubAssigner = useMemo(() => {
    if (!user || !allMinistries || !realWorkerProfile) return false;
    return allMinistries.some((m: any) => m.mealStubAssignerId === realWorkerProfile.id);
  }, [user, allMinistries, realWorkerProfile]);

  const isMinistryHead = useMemo(() => {
    if (!user || !allMinistries || !realWorkerProfile) return false;
    return allMinistries.some((m: any) => m.headId === realWorkerProfile.id);
  }, [user, allMinistries, realWorkerProfile]);

  const isLoading = isUserLoading || isRealProfileLoading || isProfileLoading || areRolesLoading || isAdminRoleLoading || isRealRoleLoading || isViewAsRoleLoading || areMinistriesLoading;

  const value = useMemo(() => {
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
      canManageFacilities: isSuperAdmin || permissions.includes('manage_facilities'),
      canCreateRoomReservation: isSuperAdmin || permissions.includes('create_room_reservation'),
      canEditRoomReservation: isSuperAdmin || permissions.includes('edit_room_reservation'),
      canDeleteRoomReservation: isSuperAdmin || permissions.includes('delete_room_reservation'),
      canApproveRoomReservation: isSuperAdmin || permissions.includes('approve_room_reservation'),
      canManageApprovals: isSuperAdmin || permissions.includes('manage_approvals'),
      canOperateScanner: isSuperAdmin || permissions.includes('operate_scanner'),
      canViewAttendance: isSuperAdmin || permissions.includes('view_attendance_log'),
      canViewMealStubs: isSuperAdmin || permissions.includes('view_meal_stubs'),
      canManageAllMealStubs: isSuperAdmin || permissions.includes('manage_all_mealstubs'),
      canViewReports: isSuperAdmin || permissions.includes('view_reports'),
      canAppointApprovers: isSuperAdmin || permissions.includes('manage_ministries'),
      canManageC2S: isSuperAdmin || permissions.includes('manage_c2s'),
      canViewC2SAnalytics: isSuperAdmin || permissions.includes('view_c2s_analytics'),
      isMealStubAssigner: isSuperAdmin || isMealStubAssigner,
      isMinistryHead: isSuperAdmin || isMinistryHead,
    };
  }, [isSuperAdmin, needsSeeding, isLoading, allRoles, workerProfile, realUserRole, isMealStubAssigner, isMinistryHead]);

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
