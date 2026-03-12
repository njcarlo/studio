import { prisma } from './packages/database/src/prisma';

async function main() {
  try {
    console.log('--- Checking prisma from @studio/database ---');
    console.log('Model keys:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));
    
    // @ts-ignore
    const count = await prisma.mealStub.count();
    console.log('MealStub count:', count);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // @ts-ignore
    await prisma.$disconnect();
  }
}

main();
