import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const admins = await prisma.worker.findMany({
      where: {
        roleId: 'admin'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true
      }
    });
    console.log(`Admins in DB:`, admins);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
