import 'server-only';
import { ok, err, toErrorMessage, type ActionResponse } from '@studio/core-engine';
import { getC2SUser } from '@/lib/auth';
import type { User, UserRole } from '@/lib/session-user';

/**
 * Role gate for C2S server actions.
 *
 * `withPermission` from core-engine keys off a single permission string, which
 * fits the ministry head but not the cluster head / coordinator / mentor tiers —
 * those are defined by their assignments, not by a permission. This wraps the
 * same `ActionResponse` envelope around a role check derived from those
 * assignments in `getC2SUser`.
 */
export function withC2SRole<TArgs extends unknown[], TReturn>(
    roles: UserRole[],
    handler: (user: User, ...args: TArgs) => Promise<TReturn>,
): (...args: TArgs) => Promise<ActionResponse<TReturn>> {
    return async (...args: TArgs): Promise<ActionResponse<TReturn>> => {
        const user = await getC2SUser();
        if (!user) return err('You must be logged in to do this.');
        if (!roles.includes(user.role)) return err('You do not have permission to do this.');

        try {
            return ok(await handler(user, ...args));
        } catch (e) {
            return err(toErrorMessage(e));
        }
    };
}

/** Every C2S role — for reads any signed-in C2S worker may run. */
export const ALL_C2S_ROLES: UserRole[] = [
    'ministry_head',
    'cluster_head',
    'c2s_coordinator',
    'mentor',
];
