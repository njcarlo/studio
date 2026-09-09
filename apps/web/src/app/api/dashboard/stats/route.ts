import { NextResponse } from 'next/server';
import { prisma } from '@studio/database/prisma';

export async function GET() {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const [totalItems, borrowedCount, overdueCount, outOfStock, allItems] = await Promise.all([
      prisma.inventoryItem.count(),
      prisma.inventoryBorrowing.count({ where: { status: 'BORROWED' } }),
      prisma.inventoryBorrowing.count({
        where: {
          status: 'BORROWED',
          dueDate: { lt: new Date() },
        },
      }),
      prisma.inventoryItem.count({ where: { quantity: 0 } }),
      prisma.inventoryItem.findMany({
        select: { quantity: true, minQuantity: true, nextMaintenanceDate: true },
      }),
    ]);

    const lowStockAlerts = allItems.filter((i) => i.quantity > 0 && i.quantity <= (i.minQuantity > 0 ? i.minQuantity : 5)).length;
    const pmsAlerts = allItems.filter((i) => i.nextMaintenanceDate && new Date(i.nextMaintenanceDate) <= thirtyDaysFromNow).length;

    return NextResponse.json({
      totalItems,
      borrowedCount,
      overdueCount,
      lowStockAlerts,
      outOfStock,
      pmsAlerts,
      totalInventoryValue: `${totalItems} SKUs`,
    });
  } catch (error: any) {
    console.error('[GET /api/dashboard/stats] error:', error);
    return NextResponse.json({
      totalItems: 0,
      borrowedCount: 0,
      overdueCount: 0,
      lowStockAlerts: 0,
      outOfStock: 0,
      pmsAlerts: 0,
      totalInventoryValue: '0 SKUs',
    });
  }
}
