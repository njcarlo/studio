import { prisma } from './packages/database/src/prisma';

async function main() {
  const workers = await prisma.worker.findMany({
    select: { roleId: true }
  });
  const roles = await prisma.role.findMany({
    select: { id: true }
  });
  const roleIds = new Set(roles.map(r => r.id));
  
  const orphans = workers.filter(w => !roleIds.has(w.roleId));
  console.log('Total workers:', workers.length);
  console.log('Orphans found:', orphans.length);
  if (orphans.length > 0) {
    console.log('Sample orphans:', orphans.slice(0, 5));
  }
}

main();
