import { cache } from 'react';
import { prisma } from '@studio/database/prisma';
import { getServerUser } from '@/lib/supabase-server';
import { ok, err, toErrorMessage, type ActionResponse } from './action-response';

// ── Cached permission resolver ─────────────────────────────────────────────────
//
// Wraps the Worker → WorkerRole → Role → RolePermission join in React's
// `cache()` so the 4-level Prisma include runs at most ONCE per request
// regardless of how many actions or components call it.

export type CallerCtx = {
  workerId: string;
  email: string;
  isSuperAdmin: boolean;
  permissions: Set<string>;
};

export const resolveCallerCtx = cache(async (): Promise<CallerCtx | null> => {
  const user = await getServerUser();
  if (!user?.email) return null;

  const email = user.email.trim().toLowerCase();
  const worker = await prisma.worker.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    include: {
      roles: {
        include: {
          role: {
            include: { rolePermissions: { include: { permission: true } } },
          },
        },
      },
    },
  });

  if (!worker) return null;

  const isSuperAdmin = worker.roles.some(wr => wr.role.isSuperAdmin);

  const permissions = new Set<string>();
  for (const wr of worker.roles) {
    for (const rp of wr.role.rolePermissions) {
      permissions.add(`${rp.permission.module}:${rp.permission.action}`);
    }
    // Legacy flat strings
    for (const p of wr.role.permissions ?? []) {
      permissions.add(p);
    }
  }

  return { workerId: worker.id, email, isSuperAdmin, permissions };
});

// ── withPermission ─────────────────────────────────────────────────────────────
//
// The single choke-point for all privileged Server Actions.
//
// Usage:
//   export const deleteWorker = withPermission(
//     PERMISSIONS.workers.delete,
//     async (ctx, id: string) => {
//       await prisma.worker.delete({ where: { id } });
//       return id;
//     },
//   );
//
// The returned function is a standard async function that takes the same
// arguments as the handler — drop-in replacement for a bare Server Action.

export function withPermission<TArgs extends unknown[], TReturn>(
  permissionKey: string | null, // null = super-admin only
  handler: (ctx: CallerCtx, ...args: TArgs) => Promise<TReturn>,
  options?: {
    /** Human-readable label written to TransactionLog. Defaults to permissionKey. */
    auditAction?: string;
    /** If true, skip writing a TransactionLog row (e.g. for read-only helpers). */
    skipAudit?: boolean;
  },
): (...args: TArgs) => Promise<ActionResponse<TReturn>> {
  return async (...args: TArgs): Promise<ActionResponse<TReturn>> => {
    // 1. Resolve caller
    const ctx = await resolveCallerCtx();
    if (!ctx) return err('You must be logged in to do this.');

    // 2. Check permission
    const allowed =
      ctx.isSuperAdmin ||
      (permissionKey !== null && ctx.permissions.has(permissionKey));
    if (!allowed) return err('You do not have permission to do this.');

    // 3. Execute handler
    let result: TReturn;
    try {
      result = await handler(ctx, ...args);
    } catch (e) {
      return err(toErrorMessage(e));
    }

    // 4. Server-side audit log (fire-and-forget — never fails the action)
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

// ── withPublicAction ───────────────────────────────────────────────────────────
//
// Wraps a Server Action that is intentionally public (no permission checks)
// in the same { success, data, error } envelope for consistency across the codebase.
//
// Usage:
//   export const createWorker = withPublicAction(
//     async (data: any) => { ... },
//   );
export function withPublicAction<TArgs extends unknown[], TReturn>(
  handler: (...args: TArgs) => Promise<TReturn>
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
