'use client';

/**
 * UserRoleSyncer — a renderless component that:
 *  1. Reads the authenticated user from the AuthStore.
 *  2. Runs Firestore listeners for worker profile, roles, and ministries.
 *  3. Derives all permission flags.
 *  4. Writes the result into the PermissionsStore.
 *
 * This replaces the UserRoleProvider Context. It renders null — all state
 * lives in Zustand, not in the React tree.
 *
 * NOTE: The component must be mounted inside FirebaseProvider so that
 * useFirestore() is available.
 */

import { useEffect, useMemo } from 'react';
import { doc, collection, query, where, limit } from 'firebase/firestore';
import type { Worker, Role } from '@studio/types';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@studio/database';
import { useAuthStore } from './auth.store';
import { useImpersonationStore } from './impersonation.store';
import { usePermissionsStore } from './permissions.store';

export function UserRoleSyncer() {
    const { user, isUserLoading } = useAuthStore();
    const { impersonatedWorkerId } = useImpersonationStore();
    const _setPermissions = usePermissionsStore((s) => s._setPermissions);
    const firestore = useFirestore();

    // ── 1. Real worker profile (by UID) ─────────────────────────────────────
    const realWorkerProfileRef = useMemoFirebase(
        () => (user ? doc(firestore, 'workers', user.uid) : null),
        [firestore, user]
    );
    const { data: rawRealWorkerProfile, isLoading: isRealProfileByIdLoading } =
        useDoc<Worker>(realWorkerProfileRef);

    // ── 2. Fallback: real profile by email ───────────────────────────────────
    const realProfileByEmailQuery = useMemoFirebase(() => {
        if (!user?.email || rawRealWorkerProfile || isRealProfileByIdLoading) return null;
        return query(
            collection(firestore, 'workers'),
            where('email', '==', user.email),
            limit(1)
        );
    }, [firestore, user?.email, rawRealWorkerProfile, isRealProfileByIdLoading]);

    const { data: realProfileByEmailData, isLoading: isRealProfileByEmailLoading } =
        useCollection<Worker>(realProfileByEmailQuery);
    const realProfileByEmail = realProfileByEmailData?.[0] ?? null;

    const realWorkerProfile = rawRealWorkerProfile ?? realProfileByEmail;
    const isRealProfileLoading =
        isRealProfileByIdLoading ||
        (!!user?.email && !rawRealWorkerProfile && isRealProfileByEmailLoading);

    // ── 3. Admin status + impersonation ─────────────────────────────────────
    const isSuperAdmin =
        user?.email === 'admin@system.com' || realWorkerProfile?.roleId === 'admin';
    const viewAsWorkerId = isSuperAdmin ? impersonatedWorkerId : null;
    const idToFetch = viewAsWorkerId ?? user?.uid;

    // ── 4. "View As" profile (by ID) ─────────────────────────────────────────
    const workerProfileRef = useMemoFirebase(
        () => (idToFetch ? doc(firestore, 'workers', idToFetch) : null),
        [firestore, idToFetch]
    );
    const { data: rawWorkerProfile, isLoading: isProfileByIdLoading } =
        useDoc<Worker>(workerProfileRef);

    // ── 5. Fallback: "View As" profile by email ──────────────────────────────
    const profileByEmailQuery = useMemoFirebase(() => {
        if (viewAsWorkerId || !user?.email || rawWorkerProfile || isProfileByIdLoading)
            return null;
        return query(
            collection(firestore, 'workers'),
            where('email', '==', user.email),
            limit(1)
        );
    }, [firestore, user?.email, rawWorkerProfile, isProfileByIdLoading, viewAsWorkerId]);

    const { data: profileByEmailData, isLoading: isProfileByEmailLoading } =
        useCollection<Worker>(profileByEmailQuery);
    const profileByEmail = profileByEmailData?.[0] ?? null;

    const workerProfile = rawWorkerProfile ?? profileByEmail;
    const isProfileLoading =
        isProfileByIdLoading ||
        (!viewAsWorkerId &&
            !!user?.email &&
            !rawWorkerProfile &&
            isProfileByEmailLoading);

    // ── 6. Roles ─────────────────────────────────────────────────────────────
    const realRoleRef = useMemoFirebase(
        () =>
            realWorkerProfile?.roleId
                ? doc(firestore, 'roles', realWorkerProfile.roleId)
                : null,
        [firestore, realWorkerProfile?.roleId]
    );
    const { data: realUserRole, isLoading: isRealRoleLoading } = useDoc<Role>(realRoleRef);

    const adminRoleRef = useMemoFirebase(
        () => (user ? doc(firestore, 'roles', 'admin') : null),
        [firestore, user]
    );
    const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc<Role>(adminRoleRef);
    const needsSeeding = !!user && !isAdminRoleLoading && !adminRole;

    const rolesRef = useMemoFirebase(
        () => (user ? collection(firestore, 'roles') : null),
        [firestore, user]
    );
    const { data: allRoles, isLoading: areRolesLoading } = useCollection<Role>(rolesRef);

    // ── 7. Ministries ─────────────────────────────────────────────────────────
    const ministriesRef = useMemoFirebase(
        () => (user ? collection(firestore, 'ministries') : null),
        [firestore, user]
    );
    const { data: allMinistries, isLoading: areMinistriesLoading } =
        useCollection<any>(ministriesRef);

    // ── 8. Derived flags ──────────────────────────────────────────────────────
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
        isAdminRoleLoading ||
        isRealRoleLoading ||
        areMinistriesLoading;

    // ── 9. Sync to PermissionsStore ───────────────────────────────────────────
    useEffect(() => {
        const permissions = realUserRole?.permissions ?? [];

        _setPermissions({
            isLoading,
            needsSeeding,
            workerProfile: workerProfile ?? null,
            allRoles: allRoles ?? [],
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

    // Renderless — all state is in Zustand
    return null;
}
