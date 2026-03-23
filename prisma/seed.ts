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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
