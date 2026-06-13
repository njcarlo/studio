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
    myScheduledMinistryIds: string[];

    // Role flags
    isSuperAdmin: boolean;
    isMinistryHead: boolean;
    isMinistryApprover: boolean;
    isMealStubAssigner: boolean;
    isMinistryScheduler: boolean;

    // Worker.flags[] (Layer 1 — scoped permission flags)
    isTeamLeader: boolean;
    isMentor: boolean;
    isHR: boolean;
    isRoomReservationManager: boolean;
    /** Ministry this worker leads as Team Leader (Worker.subMinistryId), null if not a team leader */
    teamLeaderMinistryId: string | null;

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
    canApproveEvents: boolean;
    canManageEvents: boolean;
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
    canManageVenueAssistance: boolean;
    canManageOwnMinistryAssistance: boolean;
    canManageSchedule: boolean;
    canConfirmSchedule: boolean;
    canAssignSchedulers: boolean;
    canViewAllSchedules: boolean;
    canAccessInventory: boolean;
    canChangeWorkerType: boolean;

    // Internal action — called by UserRoleSyncer
    _setPermissions: (state: Omit<PermissionsState, '_setPermissions'>) => void;
}

const DEFAULT_STATE: Omit<PermissionsState, '_setPermissions'> = {
    isLoading: true,
    needsSeeding: false,
    workerProfile: null,
    allRoles: [],
    myMinistryIds: [],
    myScheduledMinistryIds: [],
    isSuperAdmin: false,
    isMinistryHead: false,
    isMinistryApprover: false,
    isMealStubAssigner: false,
    isMinistryScheduler: false,
    isTeamLeader: false,
    isMentor: false,
    isHR: false,
    isRoomReservationManager: false,
    teamLeaderMinistryId: null,
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
    canApproveEvents: false,
    canManageEvents: false,
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
    canManageVenueAssistance: false,
    canManageOwnMinistryAssistance: false,
    canManageSchedule: false,
    canConfirmSchedule: false,
    canAssignSchedulers: false,
    canViewAllSchedules: false,
    canAccessInventory: false,
    canChangeWorkerType: false,
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
