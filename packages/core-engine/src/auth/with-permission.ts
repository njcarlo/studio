import { prisma } from '@studio/database/prisma';
import { ok, err, toErrorMessage, type ActionResponse } from './action-response';
import { resolveCallerCtx } from './resolve-caller';
import type { CallerCtx } from './types';

/**
 * True if `ctx` may create/update worker records belonging to `targetMinistryIds`.
 */
export async function canManageWorkersInMinistries(
  ctx: CallerCtx,
  targetMinistryIds: (string | null | undefined)[],
): Promise<boolean> {
  if (ctx.isSuperAdmin) return true;
  if (
    ctx.permissions.has('workers:create') ||
    ctx.permissions.has('workers:update') ||
    ctx.permissions.has('manage_workers')
  ) {
    return true;
  }

  const ministryIds = targetMinistryIds.filter((id): id is string => !!id);
  if (ministryIds.length === 0) return false;

  const count = await prisma.ministry.count({
    where: {
      id: { in: ministryIds },
      OR: [{ headId: ctx.workerId }, { approverId: ctx.workerId }],
    },
  });
  return count > 0;
}

/** True if `ctx` may update the existing worker record `targetWorkerId`. */
export async function canManageWorker(ctx: CallerCtx, targetWorkerId: string): Promise<boolean> {
  if (ctx.isSuperAdmin) return true;
  const target = await prisma.worker.findUnique({
    where: { id: targetWorkerId },
    select: { majorMinistryId: true, minorMinistryId: true },
  });
  if (!target) return false;
  return canManageWorkersInMinistries(ctx, [target.majorMinistryId, target.minorMinistryId]);
}

/** True if `workerId` carries the HR scoped permission flag (Worker.flags[]). */
export async function isHRWorker(workerId: string): Promise<boolean> {
  const worker = await prisma.worker.findUnique({
    where: { id: workerId },
    select: { flags: true },
  });
  return !!worker?.flags?.includes('hr');
}

/**
 * Choke-point for privileged Server Actions.
 * `permissionKey: null` = super-admin only.
 */
export function withPermission<TArgs extends unknown[], TReturn>(
  permissionKey: string | null,
  handler: (ctx: CallerCtx, ...args: TArgs) => Promise<TReturn>,
  options?: {
    auditAction?: string;
    skipAudit?: boolean;
  },
): (...args: TArgs) => Promise<ActionResponse<TReturn>> {
  return async (...args: TArgs): Promise<ActionResponse<TReturn>> => {
    const ctx = await resolveCallerCtx();
    if (!ctx) return err('You must be logged in to do this.');

    const allowed =
      ctx.isSuperAdmin || (permissionKey !== null && ctx.permissions.has(permissionKey));
    if (!allowed) return err('You do not have permission to do this.');

    let result: TReturn;
    try {
      result = await handler(ctx, ...args);
    } catch (e) {
      return err(toErrorMessage(e));
    }

    if (!options?.skipAudit) {
      const action = options?.auditAction ?? permissionKey ?? 'unknown';
      prisma.transactionLog
        .create({
          data: {
            userId: ctx.workerId,
            userEmail: ctx.email,
            action,
            module: permissionKey?.split(':')[0] ?? 'system',
            timestamp: new Date(),
          },
        })
        .catch((e) => console.error('[withPermission] audit log failed:', e));
    }

    return ok(result);
  };
}

/** Public / unauthenticated actions with the same response envelope. */
export function withPublicAction<TArgs extends unknown[], TReturn>(
  handler: (...args: TArgs) => Promise<TReturn>,
): (...args: TArgs) => Promise<ActionResponse<TReturn>> {
  return async (...args: TArgs): Promise<ActionResponse<TReturn>> => {
    try {
      const result = await handler(...args);
      return ok(result);
    } catch (e) {
      return err(toErrorMessage(e));
    }
  };
}
