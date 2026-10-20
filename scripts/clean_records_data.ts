import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), 'apps/web/.env.local') });
const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting System Data Cleanup ---');

  // 1. Clean Devotions pictures (set photoUrl to null and photoUrls to [])
  console.log('Cleaning devotions pictures...');
  const devotionsBefore = await prisma.c2SDevotionRecord.findMany({
    select: { id: true, photoUrl: true, photoUrls: true },
  });
  console.log(`Found ${devotionsBefore.length} devotion records.`);

  const devotionsUpdated = await prisma.c2SDevotionRecord.updateMany({
    data: {
      photoUrl: null,
      photoUrls: [],
    },
  });
  console.log(`✓ Cleaned pictures from ${devotionsUpdated.count} devotion records.`);

  // 2. Clean Room Reservations (Booking & VenueBooking)
  console.log('Cleaning room reservations...');
  // Clean assistance requests on venue bookings first if any
  try {
    await (prisma as any).assistanceRequestItem?.deleteMany({});
    await (prisma as any).assistanceRequest?.deleteMany({});
    await (prisma as any).venueAuditLog?.deleteMany({});
  } catch (err) {
    console.log('Note on assistance request cleanup:', err);
  }

  const venueBookingsDeleted = await prisma.venueBooking.deleteMany({});
  console.log(`✓ Deleted ${venueBookingsDeleted.count} VenueBooking records.`);

  const bookingsDeleted = await prisma.booking.deleteMany({});
  console.log(`✓ Deleted ${bookingsDeleted.count} Booking records.`);

  // 3. Clean Stock Monitoring (InventoryLog)
  console.log('Cleaning stock monitoring / inventory logs...');
  const logsDeleted = await prisma.inventoryLog.deleteMany({});
  console.log(`✓ Deleted ${logsDeleted.count} InventoryLog entries.`);

  console.log('--- Cleanup Finished Successfully! ---');
}

main()
  .catch((err) => {
    console.error('Cleanup error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
