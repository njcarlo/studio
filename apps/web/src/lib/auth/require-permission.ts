import { prisma } from "@studio/database/prisma";
import { getServerUser } from "@/lib/supabase-server";

/**
 * Resolves the current caller from the request's Supabase session cookie
 * (via lib/supabase-server.ts) and confirms their Worker has the given
 * permission (or is a super-admin).
 *
 * Throws if there's no session, the worker can't be found, or the caller
 * lacks permission.
 */
export async function requirePermission(permissionKey: string) {
  const user = await getServerUser();
  if (!user?.email) {
    throw new Error("Not authenticated");
  }

  const email = user.email.trim().toLowerCase();
  const worker = await prisma.worker.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
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

  if (!worker) {
    throw new Error("Forbidden");
  }

  const isSuperAdmin = worker.roles.some(wr => wr.role.isSuperAdmin);
  if (isSuperAdmin) {
    return { workerId: worker.id, email };
  }

  const hasPermission = worker.roles.some(wr =>
    wr.role.rolePermissions.some(rp => `${rp.permission.module}:${rp.permission.action}` === permissionKey)
  );

  if (!hasPermission) {
    throw new Error("Forbidden");
  }

  return { workerId: worker.id, email };
}
