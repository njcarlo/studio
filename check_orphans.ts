import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const roles = await prisma.role.findMany();
    const roleIds = roles.map(r => r.id);
    console.log(`Valid Role IDs:`, roleIds);

    const orphans = await prisma.worker.findMany({
      where: {
        roleId: {
          notIn: roleIds
        }
      },
      select: {
        id: true,
        roleId: true,
        email: true
      },
      take: 10
    });

    console.log(`Orphan Workers (roleId not in roles table):`, orphans.length);
    if (orphans.length > 0) {
      console.log(`Sample Orphans:`, orphans);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
