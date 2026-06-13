import { prisma } from '@studio/database/prisma';
import type { CallerCtx } from '@/lib/auth/with-permission';

/**
 * Generic audit log writer (Layer 4) — writes a TransactionLog row with
 * optional before/after state snapshots and a reason. This is additive to
 * the existing TransactionLog table (used by withPermission's fire-and-forget
 * audit write and the Settings > Transaction Logs page); call this directly
 * when a write has a `reason` (e.g. an approval rejection) or a meaningful
 * before/after diff worth recording (e.g. role/permission changes).
 *
 * Fire-and-forget: logging failures must never fail the underlying action.
 */
export async function writeAudit(params: {
    actor: Pick<CallerCtx, 'workerId' | 'email'> | { workerId: string; email: string; userName?: string };
    module: string;
    action: string;
    targetId?: string;
    targetName?: string;
    details?: string;
    before?: unknown;
    after?: unknown;
    reason?: string;
}): Promise<void> {
    const { actor, module, action, targetId, targetName, details, before, after, reason } = params;

    try {
        await prisma.transactionLog.create({
            data: {
                userId: actor.workerId,
                userEmail: actor.email,
                userName: 'userName' in actor ? actor.userName : undefined,
                module,
                action,
                targetId,
                targetName,
                details,
                before: (before ?? undefined) as any,
                after: (after ?? undefined) as any,
                reason,
                timestamp: new Date(),
            },
        });
    } catch (e) {
        console.error('[writeAudit] failed:', e);
    }
}
