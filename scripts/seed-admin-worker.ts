/**
 * Creates a worker profile for admin@system.com if one doesn't exist.
 * Run with: npx tsx scripts/seed-admin-worker.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@system.com';

  const existing = await prisma.worker.findUnique({ where: { email } });
  if (existing) {
    console.log(`Worker profile already exists for ${email} (id: ${existing.id})`);
    return;
  }

  // Get admin role
  const adminRole = await prisma.role.findFirst({ where: { id: 'admin' } });
  if (!adminRole) {
    console.error('No admin role found. Run seedPermissions first.');
    process.exit(1);
  }

  // Get first available ministry as fallback
  const ministry = await prisma.ministry.findFirst({ orderBy: { name: 'asc' } });
  if (!ministry) {
    console.error('No ministries found. Please seed ministries first.');
    process.exit(1);
  }

  const worker = await prisma.worker.create({
    data: {
      firstName: 'System',
      lastName: 'Admin',
      email,
      phone: 'N/A',
      roleId: adminRole.id,
      status: 'Active',
      majorMinistryId: ministry.id,
      minorMinistryId: ministry.id,
      employmentType: 'Full-time',
      workerId: '000001',
      avatarUrl: 'https://picsum.photos/seed/admin/100/100',
    },
  });

  console.log(`Created worker profile for ${email}:`, worker.id);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
