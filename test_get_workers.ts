import { getPaginatedWorkers } from './apps/web/src/actions/db';
import { PrismaClient } from '@prisma/client';

// We need to mock revalidatePath since it's a Next.js function
(global as any).revalidatePath = () => {};

async function main() {
  try {
    const result = await getPaginatedWorkers(1, 10, {});
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
