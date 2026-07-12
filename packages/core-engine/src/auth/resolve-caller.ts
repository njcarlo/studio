import { cache } from 'react';
import { prisma } from '@studio/database/prisma';
import { getConfiguredAuthUser } from './configure';
import type { CallerCtx } from './types';

/**
 * Resolve Worker + roles + permissions for the configured auth user.
 * Wrapped in React `cache()` so Server Actions / RSC share one lookup per request.
 */
async function resolveCallerCtxImpl(): Promise<CallerCtx | null> {
  const user = await getConfiguredAuthUser();
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

  const isSuperAdmin = worker.roles.some((wr) => wr.role.isSuperAdmin);

  const permissions = new Set<string>();
  for (const wr of worker.roles) {
    for (const rp of wr.role.rolePermissions) {
      permissions.add(`${rp.permission.module}:${rp.permission.action}`);
    }
    for (const p of wr.role.permissions ?? []) {
      permissions.add(p);
    }
  }

  return { workerId: worker.id, email, isSuperAdmin, permissions };
}

export const resolveCallerCtx = cache(resolveCallerCtxImpl);
