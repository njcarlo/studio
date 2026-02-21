import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { useUserRole } from './use-user-role';
import { useCallback } from 'react';

export function useAuditLog() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { workerProfile } = useUserRole();

    const logAction = useCallback(async (action: string, module: string, details?: string) => {
        if (!user) return;
        const userName = workerProfile
            ? `${workerProfile.firstName} ${workerProfile.lastName}`.trim()
            : 'User';

        try {
            await addDoc(collection(firestore, 'transaction_logs'), {
                userId: user.uid,
                userEmail: user.email || 'Unknown',
                userName,
                action,
                module,
                details: details || '',
                timestamp: serverTimestamp(),
            });
        } catch (e) {
            console.error('Failed to write audit log', e);
        }
    }, [firestore, user, workerProfile]);

    return { logAction };
}
