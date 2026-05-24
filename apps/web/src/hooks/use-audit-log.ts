import { useSupabaseUser } from '@studio/database';
import { useUserRole } from './use-user-role';
import { useCallback } from 'react';
import { createTransactionLog } from '@/actions/db';

export function useAuditLog() {
    const { user } = useSupabaseUser();
    const { workerProfile } = useUserRole();

    const logAction = useCallback(async (
        action: string,
        module: string,
        details?: string,
        targetId?: string,
        targetName?: string
    ) => {
        if (!user) return; // Still require an authenticated session

        try {
            await createTransactionLog({
                userId: workerProfile?.id || '999999',
                userEmail: user.email || 'Unknown',
                userName: workerProfile ? `${workerProfile.firstName} ${workerProfile.lastName}`.trim() : 'Admin',
                action,
                module,
                details: details || '',
                targetId: targetId || null,
                targetName: targetName || null,
            });
        } catch (e) {
            console.error('Failed to write audit log', e);
        }
    }, [user, workerProfile]);

    return { logAction };
}
