import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding VenueAssistanceSetting...');

  await prisma.venueAssistanceSetting.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      slaDays: 3,
    },
  });

  console.log('Seed complete: VenueAssistanceSetting { id: "global", slaDays: 3 }');

  console.log('Seeding Departments...');
  const departments = [
    { code: 'W', name: 'Worship', weight: 1 },
    { code: 'O', name: 'Outreach', weight: 2 },
    { code: 'R', name: 'Relationship', weight: 3 },
    { code: 'D', name: 'Discipleship', weight: 4 },
    { code: 'A', name: 'Administration', weight: 5 },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    });
  }
  console.log('Seed complete: Departments');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
