import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Supabase/SQL migration mode is active.');
  console.log('No legacy Firebase migration steps remain in this repository.');

  const workerCount = await prisma.worker.count();
  const bookingCount = await prisma.booking.count();
  const ministryCount = await prisma.ministry.count();

  console.log(`Workers in DB: ${workerCount}`);
  console.log(`Bookings in DB: ${bookingCount}`);
  console.log(`Ministries in DB: ${ministryCount}`);
}

main()
  .catch((error) => {
    console.error('Migration status check failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
