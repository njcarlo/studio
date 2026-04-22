const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const departments = await prisma.department.findMany();
    console.log(`Total departments: ${departments.length}`);
    if (departments.length === 0) {
      console.log('Seeding departments...');
      await prisma.department.createMany({
        data: [
          { code: 'W', name: 'Worship', weight: 1 },
          { code: 'O', name: 'Outreach', weight: 2 },
          { code: 'R', name: 'Relationship', weight: 3 },
          { code: 'D', name: 'Discipleship', weight: 4 },
          { code: 'A', name: 'Administration', weight: 5 },
        ]
      });
      console.log('Departments seeded.');
    } else {
      console.log(departments);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
