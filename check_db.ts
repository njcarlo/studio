import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.worker.count();
    console.log(`Total workers: ${count}`);
    const firstFive = await prisma.worker.findMany({ take: 5 });
    console.log(`First 5 workers:`, firstFive);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
