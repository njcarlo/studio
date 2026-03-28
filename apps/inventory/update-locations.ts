import { PrismaClient } from './src/generated/client';

const prisma = new PrismaClient();

async function updateLocations() {
  console.log('Updating locations...');

  // Set all items' locationId to null so we can delete the old locations
  await prisma.item.updateMany({
    data: {
      locationId: null,
    },
  });

  // Delete all existing locations
  await prisma.location.deleteMany();

  const newLocations = [
    '4th Floor Studio',
    'Main Sanc Techbooth',
    'Broadcast Room',
    'GB Sanc Techbooth',
    '4th floor EE Room',
    'SVC'
  ];

  for (const name of newLocations) {
    await prisma.location.create({
      data: { name },
    });
    console.log(`Created location: ${name}`);
  }

  console.log('Locations updated successfully!');
}

updateLocations()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
