import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const count = await prisma.worker.count();
  console.log(`Total workers in database: ${count}`);
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
