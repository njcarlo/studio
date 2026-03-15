'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Worker, Role } from '@studio/types';

/**
 * Permissions store — holds the derived role/permission flags for the
 * current (or impersonated) user. Replaces the UserRoleProvider Context.
 *
 * Components subscribe only to the slices they need, avoiding the
 * full-tree re-renders that a single large Context causes.
 */
export interface PermissionsState {
    // Loading & setup
    isLoading: boolean;
    needsSeeding: boolean;

    // Core data
    workerProfile: Worker | null;
    allRoles: Role[];
    myMinistryIds: string[];

    // Role flags
    isSuperAdmin: boolean;
    isMinistryHead: boolean;
    isMinistryApprover: boolean;
    isMealStubAssigner: boolean;

    // Permission flags
    canManageWorkers: boolean;
    canManageRoles: boolean;
    canManageMinistries: boolean;
    canManageFacilities: boolean;
    canCreateRoomReservation: boolean;
    canEditRoomReservation: boolean;
    canDeleteRoomReservation: boolean;
    canApproveRoomReservation: boolean;
    canManageApprovals: boolean;
    canApproveAllRequests: boolean;
    canOperateScanner: boolean;
    canViewAttendance: boolean;
    canViewMealStubs: boolean;
    canManageAllMealStubs: boolean;
    canViewReports: boolean;
    canAppointApprovers: boolean;
    canManageC2S: boolean;
    canViewC2SAnalytics: boolean;
    canViewScheduleMasterview: boolean;
    canViewTransactionLogs: boolean;
    canManageOrsSync: boolean;

    // Internal action — called by UserRoleSyncer
    _setPermissions: (state: Omit<PermissionsState, '_setPermissions'>) => void;
}

const DEFAULT_STATE: Omit<PermissionsState, '_setPermissions'> = {
    isLoading: true,
    needsSeeding: false,
    workerProfile: null,
    allRoles: [],
    myMinistryIds: [],
    isSuperAdmin: false,
    isMinistryHead: false,
    isMinistryApprover: false,
    isMealStubAssigner: false,
    canManageWorkers: false,
    canManageRoles: false,
    canManageMinistries: false,
    canManageFacilities: false,
    canCreateRoomReservation: false,
    canEditRoomReservation: false,
    canDeleteRoomReservation: false,
    canApproveRoomReservation: false,
    canManageApprovals: false,
    canApproveAllRequests: false,
    canOperateScanner: false,
    canViewAttendance: false,
    canViewMealStubs: false,
    canManageAllMealStubs: false,
    canViewReports: false,
    canAppointApprovers: false,
    canManageC2S: false,
    canViewC2SAnalytics: false,
    canViewScheduleMasterview: false,
    canViewTransactionLogs: false,
    canManageOrsSync: false,
};

export const usePermissionsStore = create<PermissionsState>()(
    devtools(
        (set) => ({
            ...DEFAULT_STATE,

            _setPermissions: (newState) =>
                set({ ...newState }, false, 'permissions/_setPermissions'),
        }),
        { name: 'PermissionsStore' }
    )
);
