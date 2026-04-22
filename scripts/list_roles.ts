import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.role.findMany();
  console.log('Roles:', roles.map(r => ({ id: r.id, name: r.name })));
}

main().finally(() => prisma.$disconnect());
