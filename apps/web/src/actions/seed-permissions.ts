'use server';

import { prisma } from '@studio/database/prisma';
import { ALL_PERMISSIONS, LEGACY_PERMISSION_MAP } from '@/lib/permissions/registry';

/**
 * Seeds the Permission table with all module:action entries, then
 * migrates each Role's legacy `permissions String[]` into proper
 * RolePermission rows. Also backfills WorkerRole from Worker.roleId.
 * Also ensures the 'admin' role has isSuperAdmin = true.
 *
 * Safe to run multiple times (idempotent via upsert).
 */
export async function seedPermissions() {
    // 0. Ensure the 'admin' role has isSuperAdmin = true
    await prisma.role.updateMany({
        where: { id: 'admin' },
        data: { isSuperAdmin: true },
    });
    // 1. Upsert all permissions
    for (const { module, action, description } of ALL_PERMISSIONS) {
        await prisma.permission.upsert({
            where: { module_action: { module, action } },
            update: { description },
            create: { module, action, description },
        });
    }

    // 2. For each role, migrate legacy permissions[] → RolePermission rows
    const roles = await prisma.role.findMany();
    const allPermissions = await prisma.permission.findMany();

    const permissionByKey = new Map(
        allPermissions.map(p => [`${p.module}:${p.action}`, p.id])
    );

    for (const role of roles) {
        // Super admin roles get ALL permissions
        if (role.isSuperAdmin) {
            for (const perm of allPermissions) {
                await prisma.rolePermission.upsert({
                    where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
                    update: {},
                    create: { roleId: role.id, permissionId: perm.id },
                });
            }
            continue;
        }

        const newKeys = new Set<string>();

        for (const legacy of role.permissions) {
            const mapped = LEGACY_PERMISSION_MAP[legacy] ?? [legacy];
            for (const key of mapped) {
                newKeys.add(key);
            }
        }

        for (const key of newKeys) {
            const permId = permissionByKey.get(key);
            if (!permId) continue;
            await prisma.rolePermission.upsert({
                where: { roleId_permissionId: { roleId: role.id, permissionId: permId } },
                update: {},
                create: { roleId: role.id, permissionId: permId },
            });
        }
    }

    // 3. Backfill WorkerRole from Worker.roleId (for existing workers)
    const workers = await prisma.worker.findMany({
        where: { roleId: { not: null } },
        select: { id: true, roleId: true },
    });

    for (const worker of workers) {
        if (!worker.roleId) continue;
        await prisma.workerRole.upsert({
            where: { workerId_roleId: { workerId: worker.id, roleId: worker.roleId } },
            update: {},
            create: { workerId: worker.id, roleId: worker.roleId },
        });
    }

    return {
        permissions: ALL_PERMISSIONS.length,
        roles: roles.length,
        workersBackfilled: workers.length,
    };
}
