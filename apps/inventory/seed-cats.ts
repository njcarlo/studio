import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { name: 'Battery', code: 'BAT', icon: 'zap', color: '#10b981' },
  { name: 'Card reader', code: 'CDR', icon: 'hard-drive', color: '#3b82f6' },
  { name: 'Communicator', code: 'COM', icon: 'mic', color: '#8b5cf6' },
  { name: 'External HardDrive', code: 'EXHD', icon: 'save', color: '#eab308' },
  { name: 'Mini Converters', code: 'MIC', icon: 'cpu', color: '#6366f1' },
  { name: 'Monitors', code: 'MON', icon: 'monitor', color: '#14b8a6' },
  { name: 'Power Supply', code: 'POS', icon: 'battery-charging', color: '#f59e0b' },
  { name: 'Stabilizer Gimbal', code: 'STG', icon: 'camera', color: '#db2777' },
  { name: 'Tripod', code: 'TRI', icon: 'camera', color: '#64748b' },
  { name: 'Vmount Battery', code: 'VBAT', icon: 'battery', color: '#84cc16' },
  { name: 'Wireless Video Transmitter', code: 'WVT', icon: 'radio', color: '#0ea5e9' }
];

async function main() {
  for (const cat of categories) {
    const existing = await prisma.category.findUnique({
      where: { name: cat.name }
    });
    
    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: { icon: cat.icon, color: cat.color }
      });
      console.log(`Updated ${cat.name}`);
    } else {
      await prisma.category.create({
        data: {
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          isActive: true
        }
      });
      console.log(`Created ${cat.name}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
