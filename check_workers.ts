import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const workersCount = await prisma.worker.count();
  console.log(`\n--- Worker Table Status ---`);
  console.log(`Total Workers: ${workersCount}`);
  
  if (workersCount > 0) {
    console.log(`\nSample Data (First 3):`);
    const sample = await prisma.worker.findMany({ take: 3 });
    console.table(sample.map(w => ({
      name: `${w.firstName} ${w.lastName}`,
      email: w.email,
      roleId: w.roleId,
      status: w.status
    })));
  } else {
    console.log(`The worker table is currently empty.`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
