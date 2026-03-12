
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Attempting to connect to the database...');
    const count = await prisma.worker.count();
    console.log(`Connection successful! Total workers: ${count}`);
  } catch (error) {
    console.error('Database connection failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
