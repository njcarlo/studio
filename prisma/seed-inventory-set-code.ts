/**
 * One-shot script: upserts the inventory:set_code permission into Supabase.
 * Run with: npx tsx prisma/seed-inventory-set-code.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const perm = await prisma.permission.upsert({
    where: { module_action: { module: 'inventory', action: 'set_code' } },
    update: { description: 'Set custom inventory codes on items' },
    create: {
      module: 'inventory',
      action: 'set_code',
      description: 'Set custom inventory codes on items',
    },
  });

  console.log('✅ Upserted permission:', perm);

  // Also grant it to all super-admin roles automatically
  const superAdminRoles = await prisma.role.findMany({ where: { isSuperAdmin: true } });
  for (const role of superAdminRoles) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
      update: {},
      create: { roleId: role.id, permissionId: perm.id },
    });
    console.log(`  ↳ Granted to super-admin role: ${role.id} (${role.name})`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
