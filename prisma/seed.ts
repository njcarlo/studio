import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default inventory categories for church management
const DEFAULT_INVENTORY_CATEGORIES = [
  { name: 'Audio Equipment',    description: 'Microphones, mixers, speakers, amplifiers, and audio accessories', color: '#6366f1', icon: '🎵' },
  { name: 'Video Equipment',    description: 'Cameras, projectors, screens, switchers, and video accessories',  color: '#8b5cf6', icon: '📷' },
  { name: 'Lighting',           description: 'Stage lights, LED panels, spotlights, and lighting controllers',    color: '#f59e0b', icon: '💡' },
  { name: 'Computers & IT',     description: 'Laptops, desktops, tablets, routers, and IT peripherals',          color: '#3b82f6', icon: '🖥️' },
  { name: 'Cables & Adapters',  description: 'HDMI, XLR, audio, power, and networking cables',                  color: '#10b981', icon: '🔌' },
  { name: 'Furniture',          description: 'Chairs, tables, podiums, stands, and staging materials',           color: '#78716c', icon: '🪑' },
  { name: 'Consumables',        description: 'Batteries, bulbs, tapes, stationery, and other disposables',      color: '#ef4444', icon: '📦' },
  { name: 'Safety & First Aid', description: 'Fire extinguishers, first aid kits, and safety equipment',         color: '#f97316', icon: '🧰' },
];

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

  // ── Inventory Categories ──────────────────────────────────────────────────
  console.log('\nSeeding InventoryCategory...');
  for (const cat of DEFAULT_INVENTORY_CATEGORIES) {
    const record = await prisma.inventoryCategory.upsert({
      where:  { name: cat.name },
      update: { description: cat.description, color: cat.color, icon: cat.icon },
      create: { name: cat.name, description: cat.description, color: cat.color, icon: cat.icon, isActive: true },
    });
    console.log(`  ✅ ${record.name} (${record.id})`);
  }
  console.log(`Seeded ${DEFAULT_INVENTORY_CATEGORIES.length} inventory categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
