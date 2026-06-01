/**
 * Seed script: Technology Ministry inventory dummy data
 * Run: npx tsx prisma/seed-inventory-tech.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Audio Equipment',   icon: '🎵', color: '#6366f1' },
  { name: 'Video Equipment',   icon: '📷', color: '#8b5cf6' },
  { name: 'Lighting',          icon: '💡', color: '#f59e0b' },
  { name: 'Computers & IT',    icon: '🖥️', color: '#3b82f6' },
  { name: 'Cables & Adapters', icon: '🔌', color: '#10b981' },
  { name: 'Consumables',       icon: '📦', color: '#ef4444' },
];

const ITEMS = [
  // ── Audio Equipment ───────────────────────────────────────────────
  { category: 'Audio Equipment', type: 'EQUIPMENT',  name: 'Shure SM58 Dynamic Microphone',          inventoryCode: 'AUD-001', quantity: 8,  unit: 'pcs',  status: 'Good Condition', location: 'Tech Room A', aisle: 'A', shelf: '1', bin: '1' },
  { category: 'Audio Equipment', type: 'EQUIPMENT',  name: 'Shure SM57 Instrument Microphone',       inventoryCode: 'AUD-002', quantity: 4,  unit: 'pcs',  status: 'Good Condition', location: 'Tech Room A', aisle: 'A', shelf: '1', bin: '2' },
  { category: 'Audio Equipment', type: 'EQUIPMENT',  name: 'Behringer X32 Digital Mixer',           inventoryCode: 'AUD-003', quantity: 1,  unit: 'unit', status: 'Good Condition', location: 'Main Stage',  aisle: 'B', shelf: '1', bin: '1' },
  { category: 'Audio Equipment', type: 'EQUIPMENT',  name: 'Yamaha MG12XU Analog Mixer',            inventoryCode: 'AUD-004', quantity: 2,  unit: 'unit', status: 'Good Condition', location: 'Tech Room A', aisle: 'A', shelf: '2', bin: '1' },
  { category: 'Audio Equipment', type: 'EQUIPMENT',  name: 'QSC K12.2 Active Speaker',              inventoryCode: 'AUD-005', quantity: 4,  unit: 'pcs',  status: 'Good Condition', location: 'Main Stage',  aisle: 'B', shelf: '1', bin: '2' },
  { category: 'Audio Equipment', type: 'EQUIPMENT',  name: 'JBL EON615 PA Speaker',                 inventoryCode: 'AUD-006', quantity: 2,  unit: 'pcs',  status: 'Good Condition', location: 'Tech Room A', aisle: 'A', shelf: '2', bin: '2' },
  { category: 'Audio Equipment', type: 'EQUIPMENT',  name: 'Crown XLS 1502 Power Amplifier',        inventoryCode: 'AUD-007', quantity: 2,  unit: 'unit', status: 'Good Condition', location: 'Tech Room A', aisle: 'A', shelf: '3', bin: '1' },
  { category: 'Audio Equipment', type: 'EQUIPMENT',  name: 'Sennheiser EW 135 Wireless Mic Set',    inventoryCode: 'AUD-008', quantity: 4,  unit: 'set',  status: 'Good Condition', location: 'Tech Room A', aisle: 'A', shelf: '3', bin: '2' },
  { category: 'Audio Equipment', type: 'EQUIPMENT',  name: 'In-Ear Monitor System (stereo)',         inventoryCode: 'AUD-009', quantity: 6,  unit: 'set',  status: 'Good Condition', location: 'Tech Room A', aisle: 'A', shelf: '3', bin: '3' },
  { category: 'Audio Equipment', type: 'EQUIPMENT',  name: 'Direct Input (DI) Box',                 inventoryCode: 'AUD-010', quantity: 6,  unit: 'pcs',  status: 'Good Condition', location: 'Tech Room A', aisle: 'A', shelf: '4', bin: '1' },
  { category: 'Audio Equipment', type: 'EQUIPMENT',  name: 'Microphone Floor Stand',                inventoryCode: 'AUD-011', quantity: 10, unit: 'pcs',  status: 'Good Condition', location: 'Tech Room A', aisle: 'A', shelf: '4', bin: '2' },
  { category: 'Audio Equipment', type: 'EQUIPMENT',  name: 'Microphone Boom Stand',                 inventoryCode: 'AUD-012', quantity: 6,  unit: 'pcs',  status: 'Good Condition', location: 'Tech Room A', aisle: 'A', shelf: '4', bin: '3' },
  { category: 'Audio Equipment', type: 'EQUIPMENT',  name: 'Stage Monitor Wedge Speaker',           inventoryCode: 'AUD-013', quantity: 4,  unit: 'pcs',  status: 'For Repair',      location: 'Storage' },
  { category: 'Audio Equipment', type: 'EQUIPMENT',  name: 'Subwoofer Speaker 18"',                 inventoryCode: 'AUD-014', quantity: 2,  unit: 'pcs',  status: 'Good Condition', location: 'Main Stage' },
  { category: 'Audio Equipment', type: 'EQUIPMENT',  name: 'Headphone Monitor (Sony MDR-7506)',     inventoryCode: 'AUD-015', quantity: 4,  unit: 'pcs',  status: 'Good Condition', location: 'Tech Room A', aisle: 'A', shelf: '5', bin: '1' },

  // ── Video Equipment ───────────────────────────────────────────────
  { category: 'Video Equipment', type: 'EQUIPMENT',  name: 'Sony HXR-NX5R HD Camcorder',            inventoryCode: 'VID-001', quantity: 2,  unit: 'unit', status: 'Good Condition', location: 'Tech Room B' },
  { category: 'Video Equipment', type: 'EQUIPMENT',  name: 'BlackMagic ATEM Mini Pro Switcher',     inventoryCode: 'VID-002', quantity: 1,  unit: 'unit', status: 'Good Condition', location: 'Main Stage' },
  { category: 'Video Equipment', type: 'EQUIPMENT',  name: 'Epson EB-L610U Laser Projector',        inventoryCode: 'VID-003', quantity: 3,  unit: 'unit', status: 'Good Condition', location: 'Main Hall' },
  { category: 'Video Equipment', type: 'EQUIPMENT',  name: 'Projection Screen 200"',                inventoryCode: 'VID-004', quantity: 2,  unit: 'pcs',  status: 'Good Condition', location: 'Storage' },
  { category: 'Video Equipment', type: 'EQUIPMENT',  name: 'Samsung 75" LED Display',               inventoryCode: 'VID-005', quantity: 2,  unit: 'unit', status: 'Good Condition', location: 'Lobby' },
  { category: 'Video Equipment', type: 'EQUIPMENT',  name: 'PTZ Camera (AVKANS 30x Optical)',       inventoryCode: 'VID-006', quantity: 3,  unit: 'unit', status: 'Good Condition', location: 'Main Stage' },
  { category: 'Video Equipment', type: 'EQUIPMENT',  name: 'Video Capture Card (Elgato 4K)',        inventoryCode: 'VID-007', quantity: 2,  unit: 'unit', status: 'Good Condition', location: 'Tech Room B' },
  { category: 'Video Equipment', type: 'EQUIPMENT',  name: 'Camera Tripod Heavy Duty',              inventoryCode: 'VID-008', quantity: 4,  unit: 'pcs',  status: 'Good Condition', location: 'Tech Room B' },
  { category: 'Video Equipment', type: 'EQUIPMENT',  name: 'Wireless HDMI Transmitter Set',         inventoryCode: 'VID-009', quantity: 2,  unit: 'set',  status: 'Good Condition', location: 'Tech Room B' },
  { category: 'Video Equipment', type: 'EQUIPMENT',  name: 'Teleprompter Kit 17"',                  inventoryCode: 'VID-010', quantity: 1,  unit: 'unit', status: 'Good Condition', location: 'Tech Room B' },

  // ── Lighting ──────────────────────────────────────────────────────
  { category: 'Lighting', type: 'EQUIPMENT',  name: 'Chauvet SlimPAR Pro H USB LED Par',            inventoryCode: 'LGT-001', quantity: 12, unit: 'pcs',  status: 'Good Condition', location: 'Main Stage' },
  { category: 'Lighting', type: 'EQUIPMENT',  name: 'Moving Head Beam Light 230W',                  inventoryCode: 'LGT-002', quantity: 6,  unit: 'pcs',  status: 'Good Condition', location: 'Main Stage' },
  { category: 'Lighting', type: 'EQUIPMENT',  name: 'DMX Lighting Controller 192ch',                inventoryCode: 'LGT-003', quantity: 1,  unit: 'unit', status: 'Good Condition', location: 'Tech Booth' },
  { category: 'Lighting', type: 'EQUIPMENT',  name: 'Fog / Hazer Machine',                          inventoryCode: 'LGT-004', quantity: 2,  unit: 'unit', status: 'Good Condition', location: 'Storage' },
  { category: 'Lighting', type: 'EQUIPMENT',  name: 'Followspot 575W',                              inventoryCode: 'LGT-005', quantity: 2,  unit: 'pcs',  status: 'Good Condition', location: 'Tech Booth' },
  { category: 'Lighting', type: 'EQUIPMENT',  name: 'Par Can Light 64 LED',                         inventoryCode: 'LGT-006', quantity: 8,  unit: 'pcs',  status: 'Good Condition', location: 'Main Stage' },
  { category: 'Lighting', type: 'EQUIPMENT',  name: 'Light Truss Section 2m',                       inventoryCode: 'LGT-007', quantity: 10, unit: 'pcs',  status: 'Good Condition', location: 'Storage' },
  { category: 'Lighting', type: 'EQUIPMENT',  name: 'LED Strip Light Roll 5m',                      inventoryCode: 'LGT-008', quantity: 20, unit: 'roll', status: 'Good Condition', location: 'Tech Room B' },

  // ── Computers & IT ────────────────────────────────────────────────
  { category: 'Computers & IT', type: 'EQUIPMENT',  name: 'MacBook Pro 14" M3 (ProPresenter)',       inventoryCode: 'IT-001', quantity: 2,  unit: 'unit', status: 'Good Condition', location: 'Tech Booth' },
  { category: 'Computers & IT', type: 'EQUIPMENT',  name: 'Dell XPS 15 Laptop (Backup)',             inventoryCode: 'IT-002', quantity: 2,  unit: 'unit', status: 'Good Condition', location: 'Tech Room B' },
  { category: 'Computers & IT', type: 'EQUIPMENT',  name: 'iPad Pro 12.9" (Stage Monitor)',          inventoryCode: 'IT-003', quantity: 4,  unit: 'unit', status: 'Good Condition', location: 'Tech Room B' },
  { category: 'Computers & IT', type: 'EQUIPMENT',  name: 'Mac Mini M2 (Media Server)',              inventoryCode: 'IT-004', quantity: 1,  unit: 'unit', status: 'Good Condition', location: 'Tech Booth' },
  { category: 'Computers & IT', type: 'EQUIPMENT',  name: 'Unifi UDM-Pro Network Router',            inventoryCode: 'IT-005', quantity: 1,  unit: 'unit', status: 'Good Condition', location: 'Server Room' },
  { category: 'Computers & IT', type: 'EQUIPMENT',  name: 'Unifi USW-48 Network Switch',             inventoryCode: 'IT-006', quantity: 2,  unit: 'unit', status: 'Good Condition', location: 'Server Room' },
  { category: 'Computers & IT', type: 'EQUIPMENT',  name: 'Wireless Access Point (Unifi U6-Pro)',    inventoryCode: 'IT-007', quantity: 6,  unit: 'unit', status: 'Good Condition', location: 'Main Hall' },
  { category: 'Computers & IT', type: 'EQUIPMENT',  name: 'External SSD 2TB (Samsung T7)',           inventoryCode: 'IT-008', quantity: 4,  unit: 'pcs',  status: 'Good Condition', location: 'Tech Room B' },
  { category: 'Computers & IT', type: 'EQUIPMENT',  name: 'UPS Battery Backup 1500VA',               inventoryCode: 'IT-009', quantity: 3,  unit: 'unit', status: 'Good Condition', location: 'Server Room' },
  { category: 'Computers & IT', type: 'EQUIPMENT',  name: 'Dell 27" 4K Monitor',                    inventoryCode: 'IT-010', quantity: 3,  unit: 'unit', status: 'Good Condition', location: 'Tech Booth' },

  // ── Cables & Adapters ─────────────────────────────────────────────
  { category: 'Cables & Adapters', type: 'CONSUMABLE', name: 'XLR Cable 5m',             inventoryCode: 'CAB-001', quantity: 20, unit: 'pcs', status: 'Good Condition', location: 'Tech Room A', minQuantity: 10 },
  { category: 'Cables & Adapters', type: 'CONSUMABLE', name: 'XLR Cable 10m',            inventoryCode: 'CAB-002', quantity: 15, unit: 'pcs', status: 'Good Condition', location: 'Tech Room A', minQuantity: 8  },
  { category: 'Cables & Adapters', type: 'CONSUMABLE', name: 'HDMI Cable 5m (4K)',       inventoryCode: 'CAB-003', quantity: 10, unit: 'pcs', status: 'Good Condition', location: 'Tech Room B', minQuantity: 5  },
  { category: 'Cables & Adapters', type: 'CONSUMABLE', name: 'HDMI Cable 10m (4K)',      inventoryCode: 'CAB-004', quantity: 6,  unit: 'pcs', status: 'Good Condition', location: 'Tech Room B', minQuantity: 3  },
  { category: 'Cables & Adapters', type: 'CONSUMABLE', name: 'CAT6 Network Cable 10m',   inventoryCode: 'CAB-005', quantity: 20, unit: 'pcs', status: 'Good Condition', location: 'Server Room', minQuantity: 10 },
  { category: 'Cables & Adapters', type: 'CONSUMABLE', name: 'USB-C to HDMI Adapter',    inventoryCode: 'CAB-006', quantity: 8,  unit: 'pcs', status: 'Good Condition', location: 'Tech Room B', minQuantity: 4  },
  { category: 'Cables & Adapters', type: 'CONSUMABLE', name: 'XLR to TRS Adapter',       inventoryCode: 'CAB-007', quantity: 10, unit: 'pcs', status: 'Good Condition', location: 'Tech Room A', minQuantity: 5  },
  { category: 'Cables & Adapters', type: 'CONSUMABLE', name: 'Power Extension Cord 5m',  inventoryCode: 'CAB-008', quantity: 12, unit: 'pcs', status: 'Good Condition', location: 'Tech Room A', minQuantity: 6  },
  { category: 'Cables & Adapters', type: 'CONSUMABLE', name: 'DMX Cable 3m',             inventoryCode: 'CAB-009', quantity: 15, unit: 'pcs', status: 'Good Condition', location: 'Tech Room B', minQuantity: 8  },
  { category: 'Cables & Adapters', type: 'CONSUMABLE', name: 'Speakon Cable 10m',        inventoryCode: 'CAB-010', quantity: 8,  unit: 'pcs', status: 'Good Condition', location: 'Tech Room A', minQuantity: 4  },

  // ── Consumables ───────────────────────────────────────────────────
  { category: 'Consumables', type: 'CONSUMABLE', name: 'AA Batteries (pack of 24)',       inventoryCode: 'CON-001', quantity: 10, unit: 'pack', status: 'Good Condition', location: 'Tech Room A', minQuantity: 3, reorderLevel: 5  },
  { category: 'Consumables', type: 'CONSUMABLE', name: 'AAA Batteries (pack of 24)',      inventoryCode: 'CON-002', quantity: 8,  unit: 'pack', status: 'Good Condition', location: 'Tech Room A', minQuantity: 3, reorderLevel: 5  },
  { category: 'Consumables', type: 'CONSUMABLE', name: '9V Batteries (pack of 10)',       inventoryCode: 'CON-003', quantity: 4,  unit: 'pack', status: 'Good Condition', location: 'Tech Room A', minQuantity: 2, reorderLevel: 3  },
  { category: 'Consumables', type: 'CONSUMABLE', name: 'Gaffer Tape Black 50m',           inventoryCode: 'CON-004', quantity: 6,  unit: 'roll', status: 'Good Condition', location: 'Tech Room A', minQuantity: 2, reorderLevel: 4  },
  { category: 'Consumables', type: 'CONSUMABLE', name: 'Cable Ties Assorted (100 pack)',  inventoryCode: 'CON-005', quantity: 15, unit: 'pack', status: 'Good Condition', location: 'Tech Room A', minQuantity: 5, reorderLevel: 8  },
  { category: 'Consumables', type: 'CONSUMABLE', name: 'Foam Eartips for IEM (pairs)',    inventoryCode: 'CON-006', quantity: 50, unit: 'pair', status: 'Good Condition', location: 'Tech Room A', minQuantity: 20, reorderLevel: 30 },
  { category: 'Consumables', type: 'CONSUMABLE', name: 'Microphone Windscreen',           inventoryCode: 'CON-007', quantity: 12, unit: 'pcs',  status: 'Good Condition', location: 'Tech Room A', minQuantity: 6 },
  { category: 'Consumables', type: 'CONSUMABLE', name: 'Projector Lamp 380W',             inventoryCode: 'CON-008', quantity: 3,  unit: 'pcs',  status: 'Good Condition', location: 'Storage',     minQuantity: 1, reorderLevel: 2  },
  { category: 'Consumables', type: 'CONSUMABLE', name: 'Compressed Air Spray Can 400ml',  inventoryCode: 'CON-009', quantity: 8,  unit: 'can',  status: 'Good Condition', location: 'Tech Room B', minQuantity: 3 },
  { category: 'Consumables', type: 'CONSUMABLE', name: 'Thermal Paste 10g Tube',          inventoryCode: 'CON-010', quantity: 5,  unit: 'tube', status: 'Good Condition', location: 'Tech Room B', minQuantity: 2 },
];

async function main() {
  console.log('🔧 Seeding Technology Ministry inventory...\n');

  // Upsert categories
  const categoryMap: Record<string, string> = {};
  for (const cat of CATEGORIES) {
    const record = await prisma.inventoryCategory.upsert({
      where:  { name: cat.name },
      update: { color: cat.color, icon: cat.icon },
      create: { name: cat.name, color: cat.color, icon: cat.icon, isActive: true },
    });
    categoryMap[cat.name] = record.id;
    console.log(`  ✅ Category: ${record.name}`);
  }

  console.log(`\n📦 Seeding ${ITEMS.length} items...\n`);

  let created = 0, skipped = 0;

  for (const item of ITEMS) {
    const categoryId = categoryMap[item.category];
    if (!categoryId) { console.warn(`  ⚠️  Unknown category: ${item.category}`); continue; }

    try {
      await prisma.inventoryItem.upsert({
        where:  { inventoryCode: item.inventoryCode },
        update: {
          name: item.name, quantity: item.quantity, unit: item.unit,
          status: item.status, location: item.location ?? null,
          minQuantity: (item as any).minQuantity ?? 0,
          reorderLevel: (item as any).reorderLevel ?? null,
          aisle: (item as any).aisle ?? null,
          shelf: (item as any).shelf ?? null,
          bin:   (item as any).bin   ?? null,
        },
        create: {
          name: item.name,
          type: item.type as any,
          categoryId,
          inventoryCode: item.inventoryCode,
          quantity: item.quantity,
          unit: item.unit,
          status: item.status,
          location: item.location ?? null,
          aisle: (item as any).aisle ?? null,
          shelf: (item as any).shelf ?? null,
          bin:   (item as any).bin   ?? null,
          minQuantity: (item as any).minQuantity ?? 0,
          reorderLevel: (item as any).reorderLevel ?? null,
          group: 'Technology Ministry',
          isApprovalRequired: item.type === 'EQUIPMENT',
        },
      });
      console.log(`  ✅ [${item.inventoryCode}] ${item.name}`);
      created++;
    } catch (e: any) {
      console.error(`  ❌ Failed: ${item.name} — ${e.message}`);
      skipped++;
    }
  }

  console.log(`\n✅ Done! ${created} items seeded, ${skipped} skipped.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
