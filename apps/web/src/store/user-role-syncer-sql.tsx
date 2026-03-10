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

    const needsSeeding = !!user && !areRolesLoading && (!allRoles || allRoles.length === 0);

    // ── 5. Ministries ─────────────────────────────────────────────────────────
    const { data: allMinistries, isLoading: areMinistriesLoading } = useQuery({
        queryKey: ['ministries'],
        queryFn: getMinistries,
        enabled: !!user,
    });

    // ── 6. Derived flags ──────────────────────────────────────────────────────
    const isMealStubAssigner = useMemo(() => {
        if (!user || !allMinistries || !realWorkerProfile) return false;
        return allMinistries.some(
            (m: any) => m.mealStubAssignerId === realWorkerProfile.id
        );
    }, [user, allMinistries, realWorkerProfile]);

    const isMinistryHead = useMemo(() => {
        if (!user || !allMinistries || !realWorkerProfile) return false;
        return allMinistries.some((m: any) => m.headId === realWorkerProfile.id);
    }, [user, allMinistries, realWorkerProfile]);

    const isMinistryApprover = useMemo(() => {
        if (!user || !allMinistries || !realWorkerProfile) return false;
        return allMinistries.some(
            (m: any) => m.approverId === realWorkerProfile.id
        );
    }, [user, allMinistries, realWorkerProfile]);

    const myMinistryIds = useMemo(() => {
        if (!user || !allMinistries || !realWorkerProfile) return [];
        return allMinistries
            .filter(
                (m: any) =>
                    m.headId === realWorkerProfile.id ||
                    m.approverId === realWorkerProfile.id
            )
            .map((m: any) => m.id);
    }, [user, allMinistries, realWorkerProfile]);

    const isLoading =
        isUserLoading ||
        isRealProfileLoading ||
        isProfileLoading ||
        areRolesLoading ||
        areMinistriesLoading;

    // ── 7. Sync to PermissionsStore ───────────────────────────────────────────
    useEffect(() => {
        const permissions = (realUserRole as any)?.permissions ?? [];

        _setPermissions({
            isLoading,
            needsSeeding,
            workerProfile: workerProfile ?? null,
            allRoles: (allRoles as any) ?? [],
            myMinistryIds,
            isSuperAdmin,
            isMinistryHead: isSuperAdmin || isMinistryHead,
            isMinistryApprover: isSuperAdmin || isMinistryApprover,
            isMealStubAssigner: isSuperAdmin || isMealStubAssigner,
            // Permissions
            canManageWorkers:
                isSuperAdmin ||
                permissions.includes('manage_workers') ||
                isMinistryHead ||
                isMinistryApprover,
            canManageRoles: isSuperAdmin || permissions.includes('manage_roles'),
            canManageMinistries:
                isSuperAdmin || permissions.includes('manage_ministries'),
            canManageFacilities:
                isSuperAdmin ||
                permissions.includes('manage_facilities') ||
                isMinistryApprover ||
                isMinistryHead,
            canCreateRoomReservation:
                isSuperAdmin || permissions.includes('create_room_reservation'),
            canEditRoomReservation:
                isSuperAdmin || permissions.includes('edit_room_reservation'),
            canDeleteRoomReservation:
                isSuperAdmin || permissions.includes('delete_room_reservation'),
            canApproveRoomReservation:
                isSuperAdmin ||
                permissions.includes('approve_room_reservation') ||
                isMinistryApprover ||
                isMinistryHead,
            canManageApprovals:
                isSuperAdmin ||
                permissions.includes('manage_approvals') ||
                isMinistryApprover ||
                isMinistryHead,
            canApproveAllRequests:
                isSuperAdmin || permissions.includes('manage_approvals'),
            canOperateScanner:
                isSuperAdmin || permissions.includes('operate_scanner'),
            canViewAttendance:
                isSuperAdmin || permissions.includes('view_attendance_log'),
            canViewMealStubs:
                isSuperAdmin || permissions.includes('view_meal_stubs'),
            canManageAllMealStubs:
                isSuperAdmin || permissions.includes('manage_all_mealstubs'),
            canViewReports: isSuperAdmin || permissions.includes('view_reports'),
            canAppointApprovers:
                isSuperAdmin || permissions.includes('manage_ministries'),
            canManageC2S: isSuperAdmin || permissions.includes('manage_c2s'),
            canViewC2SAnalytics:
                isSuperAdmin || permissions.includes('view_c2s_analytics'),
            canViewScheduleMasterview:
                isSuperAdmin || permissions.includes('view_schedule_masterview'),
        });
    }, [
        isLoading,
        needsSeeding,
        workerProfile,
        allRoles,
        myMinistryIds,
        isSuperAdmin,
        isMinistryHead,
        isMinistryApprover,
        isMealStubAssigner,
        realUserRole,
        _setPermissions,
    ]);

    return null;
}
