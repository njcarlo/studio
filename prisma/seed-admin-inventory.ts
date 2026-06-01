/**
 * Ensures admin@system.com (and the 'admin' role) has all inventory permissions
 * explicitly in the DB — not just via the email whitelist.
 *
 * Run: npx tsx prisma/seed-admin-inventory.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const INVENTORY_PERMISSIONS = [
  { module: 'inventory', action: 'access',   description: 'Access the Inventory Management module' },
  { module: 'inventory', action: 'manage',   description: 'Create, edit, delete items and manage stock' },
  { module: 'inventory', action: 'set_code', description: 'Set custom inventory codes on items' },
];

async function main() {
  console.log('🔐 Seeding admin inventory permissions...\n');

  // 1. Upsert inventory permissions into the Permission table
  const permIds: string[] = [];
  for (const p of INVENTORY_PERMISSIONS) {
    const perm = await prisma.permission.upsert({
      where:  { module_action: { module: p.module, action: p.action } },
      update: { description: p.description },
      create: { module: p.module, action: p.action, description: p.description },
    });
    permIds.push(perm.id);
    console.log(`  ✅ Permission: ${perm.module}:${perm.action}`);
  }

  // 2. Ensure 'admin' role exists and has isSuperAdmin = true
  const adminRole = await prisma.role.upsert({
    where:  { id: 'admin' },
    update: { isSuperAdmin: true },
    create: { id: 'admin', name: 'Admin', isSuperAdmin: true, permissions: [] },
  });
  console.log(`\n  ✅ Role: ${adminRole.name} (isSuperAdmin=${adminRole.isSuperAdmin})`);

  // 3. Assign all inventory permissions to the admin role
  for (const permId of permIds) {
    await prisma.rolePermission.upsert({
      where:  { roleId_permissionId: { roleId: adminRole.id, permissionId: permId } },
      update: {},
      create: { roleId: adminRole.id, permissionId: permId },
    });
  }
  console.log(`  ✅ All inventory permissions assigned to admin role`);

  // 4. Find admin@system.com worker and assign the admin role
  const adminWorker = await prisma.worker.findFirst({
    where: { email: 'admin@system.com' },
  });

  if (!adminWorker) {
    console.log('\n  ⚠️  No worker profile found for admin@system.com — skipping WorkerRole assignment.');
    console.log('     Log in as admin@system.com first, then re-run this script.');
  } else {
    await prisma.workerRole.upsert({
      where:  { workerId_roleId: { workerId: adminWorker.id, roleId: adminRole.id } },
      update: {},
      create: { workerId: adminWorker.id, roleId: adminRole.id },
    });
    console.log(`\n  ✅ admin@system.com assigned admin role`);
  }

  console.log('\n✅ Done — admin@system.com is inventory overseer for all ministries.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
