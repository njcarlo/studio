import { prisma } from './packages/database/src/prisma';

async function main() {
  try {
    console.log('--- Checking models ---');
    const worker = await prisma.worker.findFirst({
        include: { mealStubs: true }
    });
    console.log('Successfully queried worker with mealStubs');
    
    const mealStub = await (prisma as any).mealStub.findFirst();
    console.log('Successfully queried mealStub');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // @ts-ignore
    await prisma.$disconnect();
  }
}

main();
