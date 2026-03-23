'use client';

import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore, useImpersonationStore, usePermissionsStore } from '@studio/store';
import { getWorkerById, getWorkerByEmail, getRoleById, getRoles, getMinistries } from '@/actions/db';

export function UserRoleSyncerSQL() {
    const { user, isUserLoading } = useAuthStore();
    const { impersonatedWorkerId } = useImpersonationStore();
    const _setPermissions = usePermissionsStore((s) => s._setPermissions);

    // ── 1. Real worker profile (by UID or Email) ───────────────────────────
    const { data: realWorkerProfile, isLoading: isRealProfileLoading } = useQuery({
        queryKey: ['worker', user?.uid, user?.email],
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

    // ── 2. Admin status + impersonation ─────────────────────────────────────
    const isSuperAdmin = useMemo(() => {
        return user?.email === 'admin@system.com' || realWorkerProfile?.role?.id === 'admin' || realWorkerProfile?.roleId === 'admin';
    }, [user, realWorkerProfile]);

    const viewAsWorkerId = isSuperAdmin ? impersonatedWorkerId : null;
    const idToFetch = viewAsWorkerId ?? user?.uid;

    // ── 3. "View As" profile (by ID) ─────────────────────────────────────────
    const { data: workerProfile, isLoading: isProfileLoading } = useQuery({
        queryKey: ['worker-view-as', idToFetch],
        queryFn: async () => {
            if (!idToFetch) return null;
            return await getWorkerById(idToFetch);
        },
        enabled: !!idToFetch,
    });

    // ── 4. Roles ─────────────────────────────────────────────────────────────
    const { data: allRoles, isLoading: areRolesLoading } = useQuery({
        queryKey: ['roles'],
        queryFn: getRoles,
        enabled: !!user,
    });

    const realUserRole = useMemo(() => {
        if (!realWorkerProfile?.roleId) return null;
        return allRoles?.find(r => r.id === realWorkerProfile.roleId) || null;
    }, [realWorkerProfile, allRoles]);

    // When impersonating, use the impersonated worker's role for permissions
    const effectiveUserRole = useMemo(() => {
        if (viewAsWorkerId && workerProfile?.roleId) {
            return allRoles?.find(r => r.id === workerProfile.roleId) || null;
        }
        return realUserRole;
    }, [viewAsWorkerId, workerProfile, allRoles, realUserRole]);

    const needsSeeding = !!user && !areRolesLoading && (!allRoles || allRoles.length === 0);

    // ── 5. Ministries ─────────────────────────────────────────────────────────
    const { data: allMinistries, isLoading: areMinistriesLoading } = useQuery({
        queryKey: ['ministries'],
        queryFn: getMinistries,
        enabled: !!user,
    });

    // ── 6. Derived flags — based on the EFFECTIVE (possibly impersonated) profile ──
    // When impersonating, use the impersonated worker's profile for ministry checks
    const effectiveProfile = viewAsWorkerId ? workerProfile : realWorkerProfile;

    // isSuperAdmin reflects the REAL user's admin status (used for the banner + allowing impersonation)
    // but permissions are computed as if we ARE the impersonated user
    const isImpersonating = !!viewAsWorkerId;
    const effectiveIsSuperAdmin = useMemo(() => isImpersonating ? false : isSuperAdmin, [isImpersonating, isSuperAdmin]);

    const isMealStubAssigner = useMemo(() => {
        if (!user || !allMinistries || !effectiveProfile) return false;
        return allMinistries.some(
            (m: any) => m.mealStubAssignerId === effectiveProfile.id
        );
    }, [user, allMinistries, effectiveProfile]);

    const isMinistryHead = useMemo(() => {
        if (!user || !allMinistries || !effectiveProfile) return false;
        return allMinistries.some((m: any) => m.headId === effectiveProfile.id);
    }, [user, allMinistries, effectiveProfile]);

    const isMinistryApprover = useMemo(() => {
        if (!user || !allMinistries || !effectiveProfile) return false;
        return allMinistries.some(
            (m: any) => m.approverId === effectiveProfile.id
        );
    }, [user, allMinistries, effectiveProfile]);

    const myMinistryIds = useMemo(() => {
        if (!user || !allMinistries || !effectiveProfile) return [];
        return allMinistries
            .filter(
                (m: any) =>
                    m.headId === effectiveProfile.id ||
                    m.approverId === effectiveProfile.id
            )
            .map((m: any) => m.id);
    }, [user, allMinistries, effectiveProfile]);

    const isLoading =
        isUserLoading ||
        isRealProfileLoading ||
        isProfileLoading ||
        areRolesLoading ||
        areMinistriesLoading;

    // ── 7. Sync to PermissionsStore ───────────────────────────────────────────
    // Use useMemo to compute the permissions object, then sync it in a stable useEffect
    const permissionsPayload = useMemo(() => {
        const permissions = (effectiveUserRole as any)?.permissions ?? [];

        return {
            isLoading,
            needsSeeding,
            workerProfile: workerProfile ?? null,
            allRoles: (allRoles as any) ?? [],
            myMinistryIds,
            isSuperAdmin,
            isMinistryHead: effectiveIsSuperAdmin || isMinistryHead,
            isMinistryApprover: effectiveIsSuperAdmin || isMinistryApprover,
            isMealStubAssigner: effectiveIsSuperAdmin || isMealStubAssigner,
            canManageWorkers:
                effectiveIsSuperAdmin ||
                permissions.includes('manage_workers') ||
                isMinistryHead ||
                isMinistryApprover,
            canManageRoles: effectiveIsSuperAdmin || permissions.includes('manage_roles'),
            canManageMinistries:
                effectiveIsSuperAdmin || permissions.includes('manage_ministries'),
            canManageFacilities:
                effectiveIsSuperAdmin ||
                permissions.includes('manage_facilities') ||
                isMinistryApprover ||
                isMinistryHead,
            canCreateRoomReservation:
                effectiveIsSuperAdmin || permissions.includes('create_room_reservation'),
            canEditRoomReservation:
                effectiveIsSuperAdmin || permissions.includes('edit_room_reservation'),
            canDeleteRoomReservation:
                effectiveIsSuperAdmin || permissions.includes('delete_room_reservation'),
            canApproveRoomReservation:
                effectiveIsSuperAdmin ||
                permissions.includes('approve_room_reservation') ||
                isMinistryApprover ||
                isMinistryHead,
            canManageApprovals:
                effectiveIsSuperAdmin ||
                permissions.includes('manage_approvals') ||
                isMinistryApprover ||
                isMinistryHead,
            canApproveAllRequests:
                effectiveIsSuperAdmin || permissions.includes('manage_approvals'),
            canOperateScanner:
                effectiveIsSuperAdmin || permissions.includes('operate_scanner'),
            canViewAttendance:
                effectiveIsSuperAdmin || permissions.includes('view_attendance_log'),
            canViewMealStubs:
                effectiveIsSuperAdmin || permissions.includes('view_meal_stubs'),
            canManageAllMealStubs:
                effectiveIsSuperAdmin || permissions.includes('manage_all_mealstubs'),
            canViewReports: effectiveIsSuperAdmin || permissions.includes('view_reports'),
            canAppointApprovers:
                effectiveIsSuperAdmin || permissions.includes('manage_ministries'),
            canManageC2S: effectiveIsSuperAdmin || permissions.includes('manage_c2s'),
            canViewC2SAnalytics:
                effectiveIsSuperAdmin || permissions.includes('view_c2s_analytics'),
            canViewScheduleMasterview:
                effectiveIsSuperAdmin || permissions.includes('view_schedule_masterview'),
            canViewTransactionLogs:
                effectiveIsSuperAdmin || permissions.includes('view_transaction_logs'),
            canManageOrsSync:
                effectiveIsSuperAdmin || permissions.includes('manage_ors_sync'),
            canManageVenueAssistance:
                effectiveIsSuperAdmin || permissions.includes('manage_venue_assistance'),
            canManageOwnMinistryAssistance:
                effectiveIsSuperAdmin || permissions.includes('manage_own_ministry_assistance'),
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading, needsSeeding, workerProfile, allRoles, myMinistryIds, isSuperAdmin, effectiveIsSuperAdmin, isMinistryHead, isMinistryApprover, isMealStubAssigner, effectiveUserRole]);

    useEffect(() => {
        _setPermissions(permissionsPayload);
    }, [permissionsPayload, _setPermissions]);

    return null;
}
