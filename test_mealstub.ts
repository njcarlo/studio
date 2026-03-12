import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('--- Checking MealStub model ---');
    console.log('Model keys:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));
    
    const count = await (prisma as any).mealStub.count();
    console.log('MealStub count:', count);
  } catch (error) {
    console.error('Error accessing MealStub:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
