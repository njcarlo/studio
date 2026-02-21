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
  isMealStubAssigner: boolean;
  isMinistryHead: boolean;
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

  // Fallback: If profile by ID failed, try email
  const profileByEmailQuery = useMemoFirebase(() => {
    if (viewAsWorkerId || !user?.email || workerProfile || isProfileLoading) return null;
    return query(collection(firestore, 'workers'), where('email', '==', user.email), limit(1));
  }, [firestore, user, workerProfile, isProfileLoading, viewAsWorkerId]);
  const { data: profileByEmailData, isLoading: isProfileByEmailLoading } = useCollection<Worker>(profileByEmailQuery);
  const profileByEmail = profileByEmailData?.[0] || null;

  // Real Profile Fallback
  const realProfileByEmailQuery = useMemoFirebase(() => {
    if (!user?.email || realWorkerProfile || isRealProfileLoading) return null;
    return query(collection(firestore, 'workers'), where('email', '==', user.email), limit(1));
  }, [firestore, user, realWorkerProfile, isRealProfileLoading]);
  const { data: realProfileByEmailData, isLoading: isRealProfileByEmailLoading } = useCollection<Worker>(realProfileByEmailQuery);
  const realProfileByEmail = realProfileByEmailData?.[0] || null;

  const effectiveWorkerProfile = workerProfile || profileByEmail;
  const effectiveRealWorkerProfile = realWorkerProfile || realProfileByEmail;

  // Re-fetch role if profile was found by email
  const effectiveRoleRef = useMemoFirebase(() => effectiveWorkerProfile?.roleId ? doc(firestore, 'roles', effectiveWorkerProfile.roleId) : null, [firestore, effectiveWorkerProfile]);
  const { data: effectiveUserRole, isLoading: isEffectiveRoleLoading } = useDoc<Role>(effectiveRoleRef);

  const effectiveRealRoleRef = useMemoFirebase(() => effectiveRealWorkerProfile?.roleId ? doc(firestore, 'roles', effectiveRealWorkerProfile.roleId) : null, [firestore, effectiveRealWorkerProfile]);
  const { data: effectiveRealUserRole, isLoading: isEffectiveRealRoleLoading } = useDoc<Role>(effectiveRealRoleRef);

  // Check if the admin role exists to determine if seeding is needed.
  // IMPORTANT: Only fetch after user auth is resolved to avoid pre-auth permission errors.
  const adminRoleRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'roles', 'admin');
  }, [firestore, user]);
  const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc<Role>(adminRoleRef);
  // needsSeeding is only meaningful when the user is authenticated and the lookup is done
  const needsSeeding = !!user && !isAdminRoleLoading && !adminRole;

  // Fetch all roles for dropdowns etc.
  const rolesRef = useMemoFirebase(() => {
    if (!user) return null; // Wait for user to be authenticated
    return collection(firestore, 'roles');
  }, [firestore, user]);
  const { data: allRoles, isLoading: areAllRolesLoading } = useCollection<Role>(rolesRef);

  // Fetch ministries to check for assigner status
  const ministriesRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'ministries');
  }, [firestore, user]);
  const { data: allMinistries, isLoading: areMinistriesLoading } = useCollection<any>(ministriesRef);

  const isLoading = isUserLoading || isRealProfileLoading || isProfileLoading || areAllRolesLoading || isAdminRoleLoading || isRealRoleLoading || isViewAsRoleLoading || areMinistriesLoading || isProfileByEmailLoading || isRealProfileByEmailLoading || isEffectiveRoleLoading || isEffectiveRealRoleLoading;

  const isMealStubAssigner = useMemo(() => {
    if (!user || !allMinistries || !effectiveRealWorkerProfile) return false;
    return allMinistries.some((m: any) => m.mealStubAssignerId === effectiveRealWorkerProfile.id);
  }, [user, allMinistries, effectiveRealWorkerProfile]);

  const isMinistryHead = useMemo(() => {
    if (!user || !allMinistries || !effectiveRealWorkerProfile) return false;
    return allMinistries.some((m: any) => m.headId === effectiveRealWorkerProfile.id);
  }, [user, allMinistries, effectiveRealWorkerProfile]);

  const value = useMemo(() => {
    // For permission checks, we always use the REAL user's role, not the impersonated one.
    // Impersonation is for viewing content, not for performing actions.
    const permissions = effectiveRealUserRole?.permissions || [];
    const isActuallySuperAdmin = user?.email === 'admin@system.com' || effectiveRealWorkerProfile?.roleId === 'admin';

    return {
      isSuperAdmin: isActuallySuperAdmin,
      needsSeeding,
      isLoading,
      allRoles: allRoles || [],
      workerProfile: effectiveWorkerProfile || null,
      canManageWorkers: isActuallySuperAdmin || permissions.includes('manage_workers'),
      canManageRoles: isActuallySuperAdmin || permissions.includes('manage_roles'),
      canManageMinistries: isActuallySuperAdmin || permissions.includes('manage_ministries'),
      canManageFacilities: isActuallySuperAdmin || permissions.includes('manage_facilities'),
      canCreateRoomReservation: isActuallySuperAdmin || permissions.includes('create_room_reservation'),
      canEditRoomReservation: isActuallySuperAdmin || permissions.includes('edit_room_reservation'),
      canDeleteRoomReservation: isActuallySuperAdmin || permissions.includes('delete_room_reservation'),
      canApproveRoomReservation: isActuallySuperAdmin || permissions.includes('approve_room_reservation'),
      canManageApprovals: isActuallySuperAdmin || permissions.includes('manage_approvals'),
      canOperateScanner: isActuallySuperAdmin || permissions.includes('operate_scanner'),
      canViewAttendance: isActuallySuperAdmin || permissions.includes('view_attendance_log'),
      canViewMealStubs: isActuallySuperAdmin || permissions.includes('view_meal_stubs'),
      canManageAllMealStubs: isActuallySuperAdmin || permissions.includes('manage_all_mealstubs'),
      canViewReports: isActuallySuperAdmin || permissions.includes('view_reports'),
      canAppointApprovers: isActuallySuperAdmin || permissions.includes('manage_ministries'),
      canManageC2S: isActuallySuperAdmin || permissions.includes('manage_c2s'),
      isMealStubAssigner: isActuallySuperAdmin || isMealStubAssigner,
      isMinistryHead: isActuallySuperAdmin || isMinistryHead,
    };
  }, [needsSeeding, isLoading, allRoles, effectiveWorkerProfile, effectiveRealUserRole, isMealStubAssigner, isMinistryHead, user, effectiveRealWorkerProfile]);

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
