/**
 * Grants njcarlo@gmail.com super-admin across every module.
 *
 * Run: npx tsx prisma/seed-superadmin.ts
 *      # optionally target a different account:
 *      SUPERADMIN_EMAIL=someone@example.com npx tsx prisma/seed-superadmin.ts
 *
 * Idempotent — every write is an upsert, so re-running is safe.
 *
 * What it does:
 *   1. Seeds the whole permission registry into the `Permission` table.
 *   2. Ensures an `admin` role with isSuperAdmin = true, holding every permission.
 *   3. Ensures a `Worker` row for the email, and assigns it that role (both the
 *      `WorkerRole` join used by RBAC and the legacy `Worker.roleId` FK, since
 *      parts of the app still read the latter).
 *
 * What it does NOT do: create the Firebase Auth user. `requirePermission`
 * resolves the caller by session email and then looks up the Worker, so the
 * account must be able to sign in on its own (Google sign-in already works for
 * a Gmail address). This seed only decides what that identity may do once it is
 * signed in.
 */
import { PrismaClient } from '@prisma/client';
import { ALL_PERMISSIONS } from '../apps/web/src/lib/permissions/registry';

const prisma = new PrismaClient();

const EMAIL = (process.env.SUPERADMIN_EMAIL || 'njcarlo@gmail.com').trim().toLowerCase();
const ROLE_ID = 'admin';

async function main() {
  console.log(`🔐 Granting super-admin to ${EMAIL}...\n`);

  // 1. Permission registry → DB.
  const permissionIds: string[] = [];
  for (const p of ALL_PERMISSIONS) {
    const perm = await prisma.permission.upsert({
      where: { module_action: { module: p.module, action: p.action } },
      update: { description: p.description },
      create: { module: p.module, action: p.action, description: p.description },
    });
    permissionIds.push(perm.id);
  }
  console.log(`  ✅ ${permissionIds.length} permissions present in the registry table`);

  // 2. Super-admin role holding all of them.
  //
  // `isSuperAdmin` alone is enough for `requirePermission` (it short-circuits
  // before checking individual grants), but the explicit RolePermission rows
  // keep the roles UI honest — an editor opening this role should see every box
  // ticked rather than an empty role that mysteriously has access.
  const adminRole = await prisma.role.upsert({
    where: { id: ROLE_ID },
    update: { isSuperAdmin: true, isSystemRole: true },
    create: { id: ROLE_ID, name: 'Admin', isSuperAdmin: true, isSystemRole: true, permissions: [] },
  });
  console.log(`  ✅ Role '${adminRole.name}' (isSuperAdmin=${adminRole.isSuperAdmin})`);

  for (const permissionId of permissionIds) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId } },
      update: {},
      create: { roleId: adminRole.id, permissionId },
    });
  }
  console.log(`  ✅ All ${permissionIds.length} permissions assigned to '${adminRole.name}'`);

  // 3. Worker row for the account. Matched case-insensitively first, because
  // `Worker.email` is unique but not case-folded — creating a second row that
  // differs only in case would split the identity in two.
  const existing = await prisma.worker.findFirst({
    where: { email: { equals: EMAIL, mode: 'insensitive' } },
    select: { id: true, email: true },
  });

  const worker = existing
    ? await prisma.worker.update({
        where: { id: existing.id },
        data: { status: 'Active', roleId: adminRole.id },
        select: { id: true, email: true },
      })
    : await prisma.worker.create({
        data: {
          firstName: 'NJ',
          lastName: 'Carlo',
          email: EMAIL,
          phone: '',
          status: 'Active',
          avatarUrl: `https://picsum.photos/seed/${encodeURIComponent(EMAIL)}/100/100`,
          majorMinistryId: '',
          minorMinistryId: '',
          roleId: adminRole.id,
          passwordChangeRequired: false,
          remarks: 'Super-admin account — seeded by prisma/seed-superadmin.ts',
        },
        select: { id: true, email: true },
      });

  console.log(`  ✅ Worker ${worker.email} (${existing ? 'updated' : 'created'})`);

  await prisma.workerRole.upsert({
    where: { workerId_roleId: { workerId: worker.id, roleId: adminRole.id } },
    update: {},
    create: { workerId: worker.id, roleId: adminRole.id },
  });
  console.log(`  ✅ WorkerRole assigned`);

  console.log(`\n✅ Done — ${EMAIL} is super-admin across all modules.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
