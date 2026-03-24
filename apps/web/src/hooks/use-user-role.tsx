"use client";

/**
 * use-user-role.tsx
 *
 * Backward-compatible thin wrapper around the Zustand PermissionsStore.
 * All existing consumers using `useUserRole()` continue to work without changes —
 * they simply read from the Zustand store instead of a React Context.
 *
 * The heavy lifting (store sync + permission derivation) now lives in:
 *   src/store/user-role-syncer-sql.tsx  — renderless component mounted in AuthSync
 *   src/store/permissions.store.ts  — Zustand store
 */

import React from "react";
import { usePermissionsStore, type PermissionsState } from "@studio/store";
import { useShallow } from "zustand/react/shallow";

// Re-export the combined type under its original name for backward compatibility.
export type UserRoleContextType = Omit<PermissionsState, "_setPermissions">;

/**
 * Primary hook — reads all permission flags from the Zustand store.
 * Components subscribe only to the slices they actually use, avoiding
 * the full-tree re-renders that a single large Context caused.
 */
export function useUserRole(): UserRoleContextType {
  return usePermissionsStore(
    useShallow((s) => ({
      isLoading: s.isLoading,
      needsSeeding: s.needsSeeding,
      workerProfile: s.workerProfile,
      allRoles: s.allRoles,
      myMinistryIds: s.myMinistryIds,
      isSuperAdmin: s.isSuperAdmin,
      isMinistryHead: s.isMinistryHead,
      isMinistryApprover: s.isMinistryApprover,
      isMealStubAssigner: s.isMealStubAssigner,
      canManageWorkers: s.canManageWorkers,
      canManageRoles: s.canManageRoles,
      canManageMinistries: s.canManageMinistries,
      canManageFacilities: s.canManageFacilities,
      canCreateRoomReservation: s.canCreateRoomReservation,
      canEditRoomReservation: s.canEditRoomReservation,
      canDeleteRoomReservation: s.canDeleteRoomReservation,
      canApproveRoomReservation: s.canApproveRoomReservation,
      canManageApprovals: s.canManageApprovals,
      canApproveAllRequests: s.canApproveAllRequests,
      canOperateScanner: s.canOperateScanner,
      canViewAttendance: s.canViewAttendance,
      canViewMealStubs: s.canViewMealStubs,
      canManageAllMealStubs: s.canManageAllMealStubs,
      canViewReports: s.canViewReports,
      canAppointApprovers: s.canAppointApprovers,
      canManageC2S: s.canManageC2S,
      canViewC2SAnalytics: s.canViewC2SAnalytics,
      canViewScheduleMasterview: s.canViewScheduleMasterview,
      canViewTransactionLogs: s.canViewTransactionLogs,
      canManageOrsSync: s.canManageOrsSync,
      canManageVenueAssistance: s.canManageVenueAssistance,
      canManageOwnMinistryAssistance: s.canManageOwnMinistryAssistance,
    })),
  );
}

/**
 * No-op provider kept for backward compatibility with any legacy import
 * that wraps children in this Provider. It is now a transparent passthrough.
 * @deprecated No longer needed — state lives in Zustand. Safe to remove from JSX.
 */
export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
