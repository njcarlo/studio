import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

const prisma = new PrismaClient();

async function main() {
  await prisma.role.upsert({
    where: { id: 'viewer' },
    update: {},
    create: {
      id: 'viewer',
      name: 'Viewer',
      isSystemRole: true,
    }
  });
  console.log('Viewer role created!');
}

main().finally(() => prisma.$disconnect());
