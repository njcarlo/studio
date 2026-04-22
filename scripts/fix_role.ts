import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

const prisma = new PrismaClient();

async function main() {
  // Delete the UUID "Worker" role if it exists
  const roles = await prisma.role.findMany({ where: { name: 'Worker' }});
  for (const r of roles) {
    if (r.id !== 'viewer') {
      await prisma.role.delete({ where: { id: r.id }});
    }
  }

  // Update the 'viewer' role to have name 'Worker'
  await prisma.role.upsert({
    where: { id: 'viewer' },
    update: { name: 'Worker' },
    create: { id: 'viewer', name: 'Worker', isSystemRole: true }
  });
  
  console.log('Fixed Worker role!');
}

main().finally(() => prisma.$disconnect());
