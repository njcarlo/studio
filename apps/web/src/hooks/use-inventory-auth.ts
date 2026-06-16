'use client';

import { useUserRole } from './use-user-role';

export interface InventoryProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    majorMinistryId: string;
    minorMinistryId: string;
    canManage: boolean;
    canAccess: boolean;
    canSetCode: boolean;
    canAssignRoles: boolean;
    isSuperAdmin: boolean;
}

export function useInventoryAuth() {
    const { isSuperAdmin, workerProfile, canAccessInventory, canManageInventory } = useUserRole();

    const ministryId = isSuperAdmin ? null : (workerProfile?.majorMinistryId ?? null);

    const profile: InventoryProfile | null = workerProfile
        ? {
            id: workerProfile.id,
            firstName: workerProfile.firstName,
            lastName: workerProfile.lastName,
            email: workerProfile.email ?? '',
            majorMinistryId: workerProfile.majorMinistryId ?? '',
            minorMinistryId: workerProfile.minorMinistryId ?? '',
            canManage: canManageInventory,
            canAccess: canAccessInventory,
            canSetCode: isSuperAdmin || canManageInventory,
            canAssignRoles: isSuperAdmin,
            isSuperAdmin,
        }
        : null;

    return { profile, ministryId };
}
