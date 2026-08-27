import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');
  
  // Clean up existing data
  await prisma.inventoryLog.deleteMany();
  await prisma.item.deleteMany();
  await prisma.category.deleteMany();
  await prisma.location.deleteMany();

  // Categories
  const catElectronics = await prisma.category.create({ data: { name: 'Electronics' } });
  const catSupplies = await prisma.category.create({ data: { name: 'Supplies' } });
  const catFurniture = await prisma.category.create({ data: { name: 'Furniture' } });

  // Locations
  const loc1 = await prisma.location.create({ data: { name: '4th Floor Studio' } });
  const loc2 = await prisma.location.create({ data: { name: 'Main Sanc Techbooth' } });
  const loc3 = await prisma.location.create({ data: { name: 'Broadcast Room' } });
  await prisma.location.create({ data: { name: 'GB Sanc Techbooth' } });
  await prisma.location.create({ data: { name: '4th floor EE Room' } });
  await prisma.location.create({ data: { name: 'SVC' } });

  // Items
  const item1 = await prisma.item.create({
    data: {
      name: 'Dell XPS 15 Laptop',
      categoryId: catElectronics.id,
      type: 'Equipment',
      stock: 45,
      status: 'In Stock',
      locationId: loc1.id,
    }
  });

  const item2 = await prisma.item.create({
    data: {
      name: 'A4 Printer Paper',
      categoryId: catSupplies.id,
      type: 'Consumable',
      stock: 12,
      status: 'Low Stock',
      locationId: loc2.id,
    }
  });

  const item3 = await prisma.item.create({
    data: {
      name: 'Ergonomic Office Chair',
      categoryId: catFurniture.id,
      type: 'Equipment',
      stock: 0,
      status: 'Out of Stock',
      locationId: loc3.id,
    }
  });

  const item4 = await prisma.item.create({
    data: {
      name: 'MacBook Pro 16"',
      categoryId: catElectronics.id,
      type: 'Equipment',
      stock: 28,
      status: 'In Stock',
      locationId: loc1.id,
    }
  });

  // Logs
  await prisma.inventoryLog.create({
    data: {
      itemId: item1.id,
      action: 'Stock In',
      quantity: 10
    }
  });

  await prisma.inventoryLog.create({
    data: {
      itemId: item2.id,
      action: 'Stock Out',
      quantity: 5
    }
  });

  await prisma.inventoryLog.create({
    data: {
      itemId: item3.id,
      action: 'Adjustment',
      quantity: 0
    }
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
