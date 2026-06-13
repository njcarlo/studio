"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useAuthStore,
  useImpersonationStore,
  usePermissionsStore,
} from "@studio/store";
import {
  getWorkerById,
  getWorkerByEmail,
  getRoles,
  getMinistries,
} from "@/actions/db";

const SUPER_ADMIN_EMAILS = new Set(["admin@system.com", "pacleb@gmail.com"]);

/** Aggregate all module:action permission strings from a worker's roles. */
function aggregatePermissions(worker: any): Set<string> {
  const perms = new Set<string>();
  if (!worker) return perms;

  // Primary: WorkerRole join table (new RBAC)
  if (worker.roles && worker.roles.length > 0) {
    for (const wr of worker.roles) {
      if (wr.role?.rolePermissions) {
        for (const rp of wr.role.rolePermissions) {
          if (rp.permission) {
            perms.add(`${rp.permission.module}:${rp.permission.action}`);
          }
        }
      }
    }
  }

  // Fallback: legacy Role.permissions string[] (old flat strings)
  if (worker.role?.permissions) {
    for (const p of worker.role.permissions) {
      perms.add(p);
    }
  }

  return perms;
}

/** Check if any of the worker's roles has isSuperAdmin = true. */
function hasSuperAdminRole(worker: any): boolean {
  if (!worker) return false;
  if (worker.roles?.some((wr: any) => wr.role?.isSuperAdmin)) return true;
  if (worker.role?.isSuperAdmin) return true;
  // Legacy: role id 'admin' is treated as super admin
  if (worker.role?.id === 'admin' || worker.roleId === 'admin') return true;
  return false;
}

export function UserRoleSyncerSQL() {
  const { user, isUserLoading } = useAuthStore();
  const { impersonatedWorkerId } = useImpersonationStore();
  const _setPermissions = usePermissionsStore((s) => s._setPermissions);

  // ── 1. Real worker profile ────────────────────────────────────────────────
  const { data: realWorkerProfile, isLoading: isRealProfileLoading } = useQuery({
    queryKey: ["worker", user?.uid, user?.email],
    queryFn: async () => {
      if (!user) return null;
      let worker = await getWorkerById(user.uid);
      if (!worker && user.email) {
        worker = await getWorkerByEmail(user.email);
      }
      return worker;
    },
    enabled: !!user,
  });

  // ── 2. Super-admin determination ──────────────────────────────────────────
  const isSuperAdmin = useMemo(() => {
    const normalizedEmail = user?.email?.trim().toLowerCase();
    const isWhitelisted = !!normalizedEmail && SUPER_ADMIN_EMAILS.has(normalizedEmail);
    return isWhitelisted || hasSuperAdminRole(realWorkerProfile);
  }, [user, realWorkerProfile]);

  const viewAsWorkerId = isSuperAdmin ? impersonatedWorkerId : null;
  const isImpersonating = !!viewAsWorkerId;

  // ── 3. "View As" profile (impersonated worker) ────────────────────────────
  // Only fetched while impersonating — otherwise this would be a duplicate
  // getWorkerById(user.uid) call for the same data as realWorkerProfile.
  const { data: impersonatedProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["worker-view-as", viewAsWorkerId],
    queryFn: async () => {
      if (!viewAsWorkerId) return null;
      return await getWorkerById(viewAsWorkerId);
    },
    enabled: isImpersonating,
  });

  // ── 4. Roles (for allRoles in store) ──────────────────────────────────────
  const { data: allRoles, isLoading: areRolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: getRoles,
    enabled: !!user,
    staleTime: 5 * 60_000, // static reference data
  });

  const needsSeeding =
    !!user && !areRolesLoading && (!allRoles || allRoles.length === 0);

  // ── 5. Ministries ─────────────────────────────────────────────────────────
  const { data: allMinistries, isLoading: areMinistriesLoading } = useQuery({
    queryKey: ["ministries"],
    queryFn: getMinistries,
    enabled: !!user,
    staleTime: 5 * 60_000, // static reference data
  });

  // ── 6. Effective profile (impersonated or real) ───────────────────────────
  const workerProfile = isImpersonating ? impersonatedProfile : realWorkerProfile;
  const effectiveProfile = workerProfile;
  const effectiveIsSuperAdmin = isImpersonating ? false : isSuperAdmin;

  // Aggregate permissions from all roles of the effective profile
  const effectivePermissions = useMemo(
    () => aggregatePermissions(effectiveProfile),
    [effectiveProfile],
  );

  const hasPerm = (key: string) => effectivePermissions.has(key);

  // Ministry-level flags
  const isMealStubAssigner = useMemo(() => {
    if (!user || !allMinistries || !effectiveProfile) return false;
    return allMinistries.some((m: any) => m.mealStubAssignerId === effectiveProfile.id);
  }, [user, allMinistries, effectiveProfile]);

  const isMinistryHead = useMemo(() => {
    if (!user || !allMinistries || !effectiveProfile) return false;
    return allMinistries.some((m: any) => m.headId === effectiveProfile.id);
  }, [user, allMinistries, effectiveProfile]);

  const isMinistryApprover = useMemo(() => {
    if (!user || !allMinistries || !effectiveProfile) return false;
    return allMinistries.some((m: any) => m.approverId === effectiveProfile.id);
  }, [user, allMinistries, effectiveProfile]);

  const myMinistryIds = useMemo(() => {
    if (!user || !allMinistries || !effectiveProfile) return [];
    return allMinistries
      .filter((m: any) => m.headId === effectiveProfile.id || m.approverId === effectiveProfile.id)
      .map((m: any) => m.id);
  }, [user, allMinistries, effectiveProfile]);

  const isMinistryScheduler = useMemo(() => {
    if (!user || !allMinistries || !effectiveProfile) return false;
    return allMinistries.some((m: any) => (m.schedulerIds || []).includes(effectiveProfile.id));
  }, [user, allMinistries, effectiveProfile]);

  const myScheduledMinistryIds = useMemo(() => {
    if (!user || !allMinistries || !effectiveProfile) return [];
    return allMinistries
      .filter((m: any) => (m.schedulerIds || []).includes(effectiveProfile.id))
      .map((m: any) => m.id);
  }, [user, allMinistries, effectiveProfile]);

  // Worker.flags[] — scoped permission flags (Layer 1)
  const workerFlags: string[] = effectiveProfile?.flags ?? [];
  const isTeamLeader = workerFlags.includes('team_leader');
  const isMentor = workerFlags.includes('mentor');
  const isHR = workerFlags.includes('hr');
  const isRoomReservationManager = workerFlags.includes('room_reservation_manager');
  const isMinistrySchedulerFlag = workerFlags.includes('ministry_scheduler');
  const teamLeaderMinistryId = isTeamLeader ? (effectiveProfile?.subMinistryId ?? null) : null;

  const isLoading =
    isUserLoading ||
    isRealProfileLoading ||
    isProfileLoading ||
    areRolesLoading ||
    areMinistriesLoading;

  // ── 7. Build permissions payload and sync to store ────────────────────────
  const permissionsPayload = useMemo(() => {
    const sa = effectiveIsSuperAdmin;

    return {
      isLoading,
      needsSeeding,
      workerProfile: workerProfile ?? null,
      allRoles: (allRoles as any) ?? [],
      myMinistryIds,
      myScheduledMinistryIds,
      isSuperAdmin: effectiveIsSuperAdmin, // use effective — false during impersonation
      isMinistryHead: sa || isMinistryHead,
      isMinistryApprover: sa || isMinistryApprover,
      isMealStubAssigner: sa || isMealStubAssigner,
      isMinistryScheduler: sa || isMinistryScheduler || isMinistrySchedulerFlag,
      isTeamLeader,
      isMentor,
      isHR,
      isRoomReservationManager,
      teamLeaderMinistryId,

      // module:action checks (with legacy string fallback)
      canManageWorkers:
        sa || hasPerm('workers:create') || hasPerm('workers:update') || hasPerm('manage_workers') ||
        isMinistryHead || isMinistryApprover,
      canManageRoles:
        sa || hasPerm('roles:update') || hasPerm('manage_roles'),
      canManageMinistries:
        sa || hasPerm('ministries:manage') || hasPerm('manage_ministries'),
      canManageFacilities:
        sa || hasPerm('facilities:manage') || hasPerm('manage_facilities') ||
        isMinistryApprover || isMinistryHead,
      canCreateRoomReservation:
        sa || hasPerm('venues:create') || hasPerm('create_room_reservation'),
      canEditRoomReservation:
        sa || hasPerm('venues:update') || hasPerm('edit_room_reservation'),
      canDeleteRoomReservation:
        sa || hasPerm('venues:delete') || hasPerm('delete_room_reservation'),
      canApproveRoomReservation:
        sa || hasPerm('venues:approve') || hasPerm('approve_room_reservation') ||
        isMinistryApprover || isMinistryHead || isRoomReservationManager,
      canManageApprovals:
        sa || hasPerm('approvals:manage') || hasPerm('manage_approvals') ||
        isMinistryApprover || isMinistryHead,
      canApproveAllRequests:
        sa || hasPerm('approvals:approve_all'),
      canApproveEvents:
        sa || hasPerm('events:approve') || hasPerm('approvals:approve_events'),
      canManageEvents:
        sa || hasPerm('events:create') || hasPerm('events:update') || hasPerm('events:delete'),
      canOperateScanner:
        sa || hasPerm('attendance:scan') || hasPerm('operate_scanner'),
      canViewAttendance:
        sa || hasPerm('attendance:view') || hasPerm('view_attendance_log'),
      canViewMealStubs:
        sa || hasPerm('meals:view') || hasPerm('view_meal_stubs'),
      canManageAllMealStubs:
        sa || hasPerm('meals:manage') || hasPerm('manage_all_mealstubs'),
      canViewReports:
        sa || hasPerm('reports:view') || hasPerm('view_reports'),
      canAppointApprovers:
        sa || hasPerm('ministries:manage') || hasPerm('manage_ministries'),
      canManageC2S:
        sa || hasPerm('mentorship:manage') || hasPerm('manage_c2s'),
      canViewC2SAnalytics:
        sa || hasPerm('mentorship:view_reports') || hasPerm('view_c2s_analytics'),
      canViewScheduleMasterview:
        sa || hasPerm('venues:view_calendar') || hasPerm('view_schedule_masterview'),
      canViewTransactionLogs:
        sa || hasPerm('system:view_audit_logs') || hasPerm('view_transaction_logs'),
      canManageOrsSync:
        sa || hasPerm('system:manage_ors_sync') || hasPerm('manage_ors_sync'),
      canManageVenueAssistance:
        sa || hasPerm('venue_assistance:manage') || hasPerm('manage_venue_assistance'),
      canManageOwnMinistryAssistance:
        sa || hasPerm('venue_assistance:manage_own_ministry') ||
        hasPerm('manage_own_ministry_assistance'),
      canManageSchedule:
        sa || hasPerm('schedule:manage') || isMinistryScheduler || isMinistrySchedulerFlag,
      canViewAllSchedules:
        sa || hasPerm('schedule:view_all'),
      canConfirmSchedule:
        sa || hasPerm('schedule:confirm') || hasPerm('schedule:manage') || isMinistryScheduler || isMinistrySchedulerFlag,
      canAssignSchedulers:
        sa || hasPerm('schedule:assign_schedulers') || isMinistryHead,
      canChangeWorkerType:
        sa || hasPerm('worker_type:change') || isHR,
      canAccessInventory:
        sa || hasPerm('inventory:access'),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isLoading,
    needsSeeding,
    workerProfile,
    allRoles,
    myMinistryIds,
    isSuperAdmin,
    effectiveIsSuperAdmin,
    effectivePermissions,
    isMinistryHead,
    isMinistryApprover,
    isMealStubAssigner,
    isMinistryScheduler,
    isMinistrySchedulerFlag,
    isTeamLeader,
    isMentor,
    isHR,
    isRoomReservationManager,
    teamLeaderMinistryId,
    myScheduledMinistryIds,
  ]);

  useEffect(() => {
    _setPermissions(permissionsPayload);
  }, [permissionsPayload, _setPermissions]);

  return null;
}
