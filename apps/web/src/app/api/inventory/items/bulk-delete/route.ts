import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@studio/database/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { itemIds } = body;

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: 'itemIds array is required' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.inventoryLog.deleteMany({ where: { itemId: { in: itemIds } } }),
      prisma.inventoryBorrowing.deleteMany({ where: { itemId: { in: itemIds } } }),
      prisma.inventoryItem.deleteMany({ where: { id: { in: itemIds } } }),
    ]);

    return NextResponse.json({ success: true, count: itemIds.length });
  } catch (error: any) {
    console.error('[POST /api/inventory/items/bulk-delete] error:', error);
    return NextResponse.json({ error: 'Bulk delete failed', details: error?.message }, { status: 500 });
  }
}
